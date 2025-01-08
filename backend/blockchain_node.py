import os
from flask import Flask, jsonify, request
import hashlib
import time
import json
import requests
import zlib
import base64
from PIL import Image
import io
import threading
from concurrent.futures import ThreadPoolExecutor, as_completed
import logging

# Configure logging
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')
logger = logging.getLogger(__name__)

class Transaction:
    def __init__(self, data, transaction_type="generic"):
        self.data = data
        self.timestamp = time.time()
        self.type = transaction_type
        self.crc = self.calculate_crc()
        self.confirmations = set()  # Set of nodes that confirmed this transaction

    def calculate_crc(self):
        """Calculate CRC32 checksum for data verification"""
        if isinstance(self.data, bytes):
            return format(zlib.crc32(self.data) & 0xFFFFFFFF, '08x')
        return format(zlib.crc32(str(self.data).encode()) & 0xFFFFFFFF, '08x')

    def verify_crc(self):
        """Verify data integrity using CRC32 checksum"""
        return self.crc == self.calculate_crc()

    def to_dict(self):
        if self.type == "image":
            # Convert image data to base64 for JSON serialization
            return {
                "type": self.type,
                "data": base64.b64encode(self.data).decode('utf-8'),
                "timestamp": self.timestamp,
                "crc": self.crc,
                "confirmations": list(self.confirmations)
            }
        return {
            "type": self.type,
            "data": self.data,
            "timestamp": self.timestamp,
            "crc": self.crc,
            "confirmations": list(self.confirmations)
        }

    @staticmethod
    def from_dict(data_dict):
        transaction = Transaction(
            base64.b64decode(data_dict["data"]) if data_dict["type"] == "image" else data_dict["data"],
            data_dict["type"]
        )
        transaction.timestamp = data_dict["timestamp"]
        transaction.crc = data_dict["crc"]
        transaction.confirmations = set(data_dict["confirmations"])
        return transaction

class Block:
    def __init__(self, index, previous_hash, transactions, timestamp=None):
        self.index = index
        self.previous_hash = previous_hash
        self.transactions = transactions
        self.timestamp = timestamp or time.time()
        self.nonce = 0
        self.hash = self.calculate_hash()

    def calculate_hash(self):
        block_string = json.dumps({
            'index': self.index,
            'previous_hash': self.previous_hash,
            'transactions': [t.to_dict() for t in self.transactions],
            'timestamp': self.timestamp,
            'nonce': self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self, difficulty):
        target = '0' * difficulty
        while self.hash[:difficulty] != target:
            self.nonce += 1
            self.hash = self.calculate_hash()

def generate_node_addresses(start_port, num_nodes):
    # Używamy nazw serwisów z docker-compose zamiast localhost
    return [f"http://node{i}:{5000 + i}" for i in range(1, num_nodes + 1)]

class BlockchainNode:
    def __init__(self, node_id, start_port=5001, num_nodes=6, difficulty=2):
        self.node_id = node_id
        self.chain = [self.create_genesis_block()]
        self.difficulty = difficulty
        self.pending_transactions = []
        # Generowanie adresów węzłów używając nazw serwisów Docker
        self.nodes = self.generate_docker_node_addresses(num_nodes)
        self.lock = threading.Lock()
        self.mining_status = {"is_mining": False, "progress": 0}

    def generate_docker_node_addresses(self, num_nodes):
        """Generuje adresy węzłów używając nazw serwisów Docker"""
        node_addresses = []
        for i in range(1, num_nodes + 1):
            # Pomijamy bieżący węzeł przy generowaniu listy innych węzłów
            if f"node{i}" != self.node_id:
                node_addresses.append(f"http://node{i}:500{i}")
        return node_addresses

    def broadcast_transaction(self, transaction):
        """Broadcast transaction to other nodes"""
        logger.info("Broadcasting transaction")
        logger.info(f"Current node: {self.node_id}")
        logger.info(f"Broadcasting to nodes: {self.nodes}")

        def confirm_with_node(node_address):
            try:
                logger.info(f"Contacting node: {node_address}")
                response = requests.post(
                    f"{node_address}/blockchain/verify_transaction",
                    json=transaction.to_dict(),
                    timeout=5
                )
                if response.status_code == 200:
                    logger.info(f"Node {node_address} confirmed transaction")
                    return node_address
                else:
                    logger.warning(f"Node {node_address} rejected transaction with status {response.status_code}")
            except requests.exceptions.RequestException as e:
                logger.error(f"Error contacting node {node_address}: {e}")
            return None

        nodes_contacted = []
        with ThreadPoolExecutor(max_workers=10) as executor:
            futures = [executor.submit(confirm_with_node, node) for node in self.nodes]
            confirmations = set()
            for future in as_completed(futures):
                result = future.result()
                if result:
                    confirmations.add(result)
                    nodes_contacted.append(result)

        logger.info(f"Nodes contacted: {nodes_contacted}")
        required_confirmations = (len(self.nodes) * 2) // 3
        logger.info(f"Confirmations: {len(confirmations)} / {len(self.nodes)} required: {required_confirmations}")
        return len(confirmations) >= required_confirmations

    def is_chain_valid(self, chain):
        """Verify if a given chain is valid"""
        for i in range(1, len(chain)):
            current_block = chain[i]
            previous_block = chain[i-1]

            # Verify current block hash
            if current_block.hash != current_block.calculate_hash():
                return False

            # Verify chain continuity
            if current_block.previous_hash != previous_block.hash:
                return False

            # Verify block mining difficulty
            if current_block.hash[:self.difficulty] != "0" * self.difficulty:
                return False

            # Verify all transactions in the block
            for transaction in current_block.transactions:
                if not transaction.verify_crc():
                    return False

        return True

    def resolve_conflicts(self):
        """
        Consensus algorithm. Resolves conflicts by replacing our chain with the longest valid chain in the network.
        Returns True if our chain was replaced, False otherwise.
        """
        new_chain = None
        current_length = len(self.chain)
        
        logger.info(f"Starting chain resolution. Current length: {current_length}")

        # Get and verify chains from all nodes
        for node in self.nodes:
            try:
                logger.info(f"Contacting node: {node}")
                logger.info(f'{node}/blockchain/chain')
                response = requests.get(f'{node}/blockchain/chain', timeout=5)
                logger.info(f"Response status: {response.status_code}")
                logger.info(f"Response data: {response.json()}")
                if response.status_code == 200:
                    chain_data = response.json()
                    chain_length = chain_data['length']
                    chain = []

                    # Reconstruct the chain from JSON data
                    for block_data in chain_data['chain']:
                        transactions = [Transaction.from_dict(t) for t in block_data['transactions']]
                        block = Block(
                            block_data['index'],
                            block_data['previous_hash'],
                            transactions,
                            block_data['timestamp']
                        )
                        block.hash = block_data['hash']
                        chain.append(block)

                    # Check if the chain is longer and valid
                    if chain_length > current_length and self.is_chain_valid(chain):
                        current_length = chain_length
                        new_chain = chain
                        logger.info(f"Found valid longer chain from {node}, length: {chain_length}")

            except requests.exceptions.RequestException as e:
                logger.error(f"Error contacting node {node}: {e}")
                continue

        # Replace our chain if we found a valid longer one
        if new_chain:
            self.chain = new_chain
            logger.info("Chain replaced successfully")
            return True

        logger.info("Current chain is authoritative")
        return False

    def create_genesis_block(self):
        return Block(0, "0", [Transaction("Genesis Block")], time.time())

    def get_latest_block(self):
        return self.chain[-1]

    def add_transaction(self, transaction):
        if not transaction.verify_crc():
            raise ValueError("Transaction CRC verification failed")
        
        with self.lock:
            self.pending_transactions.append(transaction)



    def verify_transaction(self, transaction_data):
        """Verify a transaction received from another node"""
        transaction = Transaction.from_dict(transaction_data)
        if not transaction.verify_crc():
            return False
        
        # Additional verification logic can be added here
        return True

    def process_image(self, image_data):
        """Complete image processing pipeline"""
        logger.info("Starting image processing pipeline")
        
        try:
            # 1. Create transaction and get initial CRC
            transaction = Transaction(image_data, "image")
            initial_crc = transaction.calculate_crc()
            logger.info(f"Initial CRC: {initial_crc}")
            
            # 2. Verify transaction
            if not transaction.verify_crc():
                raise ValueError("Initial CRC verification failed")
            
            # 3. Broadcast to network and collect confirmations
            confirmation_result = self.broadcast_transaction(transaction)
            if not confirmation_result:
                raise ValueError("Failed to get network consensus")
            
            # 4. Add to pending transactions
            self.add_transaction(transaction)
            
            # 5. Mine block automatically
            mining_result = self.mine_pending_transactions()
            if not mining_result["success"]:
                raise ValueError("Mining failed")
            
            # 6. Resolve conflicts across network
            self.resolve_conflicts()
            
            # 7. Verify final state
            final_block = self.get_latest_block()
            stored_transaction = final_block.transactions[-1]
            if not stored_transaction.verify_crc():
                raise ValueError("Final CRC verification failed")
                
            return {
                "success": True,
                "initial_crc": initial_crc,
                "final_crc": stored_transaction.crc,
                "block_index": final_block.index,
                "confirmations": len(stored_transaction.confirmations)
            }
            
        except Exception as e:
            logger.error(f"Image processing pipeline failed: {e}")
            return {
                "success": False,
                "error": str(e)
            }
          
    def verify_block(self, block):
        # Verify block hash
        if block.hash[:self.difficulty] != "0" * self.difficulty:
            return False

        # Verify transactions
        for transaction in block.transactions:
            if not transaction.verify_crc():
                return False

        return True

    def mine_pending_transactions(self):
        if not self.pending_transactions:
            logger.warning("No pending transactions to mine")
            return {"success": False, "message": "No pending transactions to mine"}

        with self.lock:
            try:
                self.mining_status["is_mining"] = True
                self.mining_status["progress"] = 0
                logger.info("Mining started")

                block = Block(
                    len(self.chain),
                    self.get_latest_block().hash,
                    self.pending_transactions
                )
                logger.info(f"Mining block: Index={block.index}")

                # Update mining progress
                self.mining_status["progress"] = 50
                block.mine_block(self.difficulty)
                logger.info(f"Block mined: Hash={block.hash}, Nonce={block.nonce}")

                if not self.verify_block(block):
                    logger.error("Block verification failed")
                    return {"success": False, "message": "Block verification failed"}

                self.mining_status["progress"] = 75
                self.chain.append(block)
                self.pending_transactions = []
                self.mining_status["progress"] = 100
                logger.info("Block successfully added to the chain")
                return {
                    "success": True,
                    "message": "Block mined successfully",
                    "block": {
                        "index": block.index,
                        "hash": block.hash,
                        "transaction_count": len(block.transactions)
                    }
                }
            except Exception as e:
                logger.exception(f"Error during mining: {e}")
                return {"success": False, "message": f"Mining failed: {str(e)}"}
            finally:
                self.mining_status["is_mining"] = False

def create_blockchain_app():
    app = Flask(__name__)
    node_id = os.getenv('NODE_ID', 'node1')
    blockchain = BlockchainNode(node_id=node_id)

    @app.route('/transaction/new', methods=['POST'])
    def new_transaction():
        values = request.get_json()
        logger.info(f"Received new transaction request: {values}")

        try:
            transaction = Transaction(values['data'], values.get('type', 'generic'))
            logger.info("Created transaction")

            if blockchain.broadcast_transaction(transaction):
                blockchain.add_transaction(transaction)
                logger.info("Transaction successfully added and broadcasted")
                return jsonify({'message': 'Transaction added successfully!'}), 201
            logger.warning("Transaction rejected by the network")
            return jsonify({'message': 'Transaction rejected by network'}), 400
        except Exception as e:
            logger.exception(f"Error in new_transaction: {e}")
            return jsonify({'message': str(e)}), 400

    @app.route('/verify_transaction', methods=['POST'])
    def verify_transaction():
        transaction_data = request.get_json()
        logger.info("Transaction received for verification")

        if blockchain.verify_transaction(transaction_data):
            logger.info("Transaction verified successfully")
            return jsonify({'message': 'Transaction verified'}), 200
        logger.warning("Transaction verification failed")
        return jsonify({'message': 'Transaction verification failed'}), 400

    @app.route('/image/process', methods=['POST'])
    def process_image():
        try:
            if 'image' not in request.files:
                return jsonify({'error': 'No image file provided'}), 400
                
            image_file = request.files['image']
            image_data = image_file.read()
            
            # Uruchom cały pipeline
            result = blockchain.process_image(image_data)
            
            if result["success"]:
                return jsonify({
                    'success': True,
                    'message': 'Image successfully stored in blockchain',
                    'details': result
                }), 200
            else:
                return jsonify({
                    'success': False,
                    'error': result["error"]
                }), 400
                
        except Exception as e:
            logger.exception("Image processing failed")
            return jsonify({'error': str(e)}), 500
    
    @app.route('/mine', methods=['GET'])
    def mine():
        if blockchain.mining_status["is_mining"]:
            logger.warning("Mining already in progress")
            return jsonify({
                'success': False,
                'message': 'Mining already in progress',
                'progress': blockchain.mining_status["progress"],
                'confirmations': len(blockchain.pending_transactions)
            }), 409

        result = blockchain.mine_pending_transactions()

        if result["success"]:
            logger.info("Starting consensus resolution after mining")
            was_chain_replaced = blockchain.resolve_conflicts()

            for node in blockchain.nodes:
                try:
                    requests.get(f'http://{node}/blockchain/nodes/resolve', timeout=5)
                    logger.info(f"Notified node {node} about the new chain")
                except requests.exceptions.RequestException as e:
                    logger.error(f"Error notifying node {node}: {e}")

            result["chain_status"] = "replaced" if was_chain_replaced else "authoritative"
            return jsonify(result), 200
        else:
            logger.error("Mining failed")
            return jsonify(result), 400

    @app.route('/chain', methods=['GET'])
    def get_chain():
        logger.info("Fetching the blockchain")
        response = {
            'chain': [
                {
                    'index': block.index,
                    'previous_hash': block.previous_hash,
                    'timestamp': block.timestamp,
                    'transactions': [t.to_dict() for t in block.transactions],
                    'hash': block.hash,
                    'confirmations': len(block.transactions[0].confirmations)
                }
                for block in blockchain.chain
            ],
            'length': len(blockchain.chain)
        }
        return jsonify(response), 200

    @app.route('/simulate/failure', methods=['POST'])
    def simulate_failure():
        data = request.get_json()
        failure_type = data.get('type', 'node_down')
        logger.warning(f"Simulating failure of type: {failure_type}")

        if failure_type == 'node_down':
            logger.critical("Simulating node down failure. Exiting process.")
            os._exit(1)
        elif failure_type == 'network_delay':
            logger.info("Simulating network delay")
            time.sleep(10)
            return jsonify({'message': 'Network delay simulated'}), 200
        elif failure_type == 'data_corruption':
            logger.warning("Simulating data corruption")
            for transaction in blockchain.pending_transactions:
                transaction.crc = 'corrupted'
            return jsonify({'message': 'Data corruption simulated'}), 200

        logger.error("Unknown failure type provided")
        return jsonify({'message': 'Unknown failure type'}), 400

    @app.route('/nodes/resolve', methods=['GET'])
    def consensus():
        logger.info("Starting consensus resolution")
        replaced = blockchain.resolve_conflicts()
        chain_data = [{
            'index': block.index,
            'previous_hash': block.previous_hash,
            'transactions': [t.to_dict() for t in block.transactions],
            'timestamp': block.timestamp,
            'hash': block.hash
        } for block in blockchain.chain]

        if replaced:
            logger.info("Chain was replaced with a longer valid chain")
        else:
            logger.info("Current chain is authoritative")

        return jsonify({
            'message': 'Chain was replaced' if replaced else 'Chain is authoritative',
            'chain': chain_data,
            'length': len(blockchain.chain)
        }), 200

    return app
