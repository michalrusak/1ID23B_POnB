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

class BlockchainNode:
    def __init__(self, node_id, difficulty=2):
        self.node_id = node_id
        self.chain = [self.create_genesis_block()]
        self.difficulty = difficulty
        self.pending_transactions = []
        self.nodes = set()
        self.lock = threading.Lock()
        self.mining_status = {"is_mining": False, "progress": 0}

    def create_genesis_block(self):
        return Block(0, "0", [Transaction("Genesis Block")], time.time())

    def get_latest_block(self):
        return self.chain[-1]

    def add_transaction(self, transaction):
        if not transaction.verify_crc():
            raise ValueError("Transaction CRC verification failed")
        
        with self.lock:
            self.pending_transactions.append(transaction)

    def broadcast_transaction(self, transaction):
        print(f"Broadcasting transaction")  # Log danych transakcji

        def confirm_with_node(node_address):
            try:
                print(f"Contacting node: {node_address}")  # Log kontaktu z węzłem
                response = requests.post(
                    f'http://{node_address}/verify_transaction',
                    json=transaction.to_dict(),
                    timeout=5
                )
                if response.status_code == 200:
                    print(f"Node {node_address} confirmed transaction")  # Sukces
                    return node_address
                else:
                    print(f"Node {node_address} rejected transaction with status {response.status_code}")  # Błąd statusu
            except requests.exceptions.RequestException as e:
                print(f"Error contacting node {node_address}: {e}")  # Błąd sieciowy
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

        print(f"Nodes contacted: {nodes_contacted}")  # Lista kontaktowanych węzłów
        print(f"Confirmations: {len(confirmations)} / {len(self.nodes)} required: {len(self.nodes) * 2 // 3}")
        return len(confirmations) >= len(self.nodes) * 2 // 3


    def verify_transaction(self, transaction_data):
        """Verify a transaction received from another node"""
        transaction = Transaction.from_dict(transaction_data)
        if not transaction.verify_crc():
            return False
        
        # Additional verification logic can be added here
        return True

    def process_image(self, image_data):
        print(f"Processing image of size: {len(image_data)} bytes")  # Rozmiar obrazu
        try:
            img = Image.open(io.BytesIO(image_data))
            print(f"Image opened successfully, format: {img.format}")  # Szczegóły obrazu

            transaction = Transaction(image_data, "image")
            print(f"Created image transaction")  # Szczegóły transakcji

            if self.broadcast_transaction(transaction):
                self.add_transaction(transaction)
                print("Image transaction added and broadcasted successfully")  # Sukces
                return True
            print("Image transaction broadcasting failed")  # Niepowodzenie
            return False
        except Exception as e:
            print(f"Error processing image: {e}")  # Log błędu
            return False

    
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
            print("No pending transactions to mine")  # Brak transakcji
            return {"success": False, "message": "No pending transactions to mine"}

        with self.lock:
            try:
                self.mining_status["is_mining"] = True
                self.mining_status["progress"] = 0
                print("Mining started")  # Start procesu kopania

                block = Block(
                    len(self.chain),
                    self.get_latest_block().hash,
                    self.pending_transactions
                )
                print(f"Mining block: Index={block.index}")  # Szczegóły bloku

                # Update mining progress
                self.mining_status["progress"] = 50
                block.mine_block(self.difficulty)
                print(f"Block mined: Hash={block.hash}, Nonce={block.nonce}")  # Sukces kopania

                if not self.verify_block(block):
                    print("Block verification failed")  # Niepowodzenie weryfikacji
                    return {"success": False, "message": "Block verification failed"}

                self.mining_status["progress"] = 75
                self.chain.append(block)
                self.pending_transactions = []
                self.mining_status["progress"] = 100
                print("Block successfully added to the chain")  # Dodano blok
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
                print(f"Error during mining: {e}")  # Log błędu
                return {"success": False, "message": f"Mining failed: {str(e)}"}
            finally:
                self.mining_status["is_mining"] = False



def create_blockchain_app():
    app = Flask(__name__)
    blockchain = BlockchainNode("node1")  # Node ID will be set during initialization

    @app.route('/transaction/new', methods=['POST'])
    def new_transaction():
        values = request.get_json()
        print(f"Received new transaction request: {values}")  # Otrzymane dane wejściowe

        try:
            transaction = Transaction(values['data'], values.get('type', 'generic'))
            print(f"Created transaction")  # Log stworzonych danych transakcji

            if blockchain.broadcast_transaction(transaction):
                blockchain.add_transaction(transaction)
                print("Transaction successfully added and broadcasted")  # Sukces
                return jsonify({'message': 'Transaction added successfully!'}), 201
            print("Transaction rejected by the network")  # Odrzucone przez sieć
            return jsonify({'message': 'Transaction rejected by network'}), 400
        except Exception as e:
            print(f"Error in new_transaction: {e}")  # Log błędu
            return jsonify({'message': str(e)}), 400

    @app.route('/verify_transaction', methods=['POST'])
    def verify_transaction():
        transaction_data = request.get_json()
        print(f"Transaction received for verification")  # Otrzymane dane

        if blockchain.verify_transaction(transaction_data):
            print("Transaction verified successfully")  # Sukces weryfikacji
            return jsonify({'message': 'Transaction verified'}), 200
        print("Transaction verification failed")  # Weryfikacja nie powiodła się
        return jsonify({'message': 'Transaction verification failed'}), 400



    @app.route('/image/process', methods=['POST'])
    def process_image():
        if 'image' not in request.files:
            print("No image provided in the request")  # Brak obrazu w żądaniu
            return jsonify({'message': 'No image provided'}), 400

        image_file = request.files['image']
        image_data = image_file.read()
        print(f"Received image of size: {len(image_data)} bytes")  # Rozmiar obrazu

        if blockchain.process_image(image_data):
            print("Image processed successfully")  # Sukces
            return jsonify({'message': 'Image processed successfully'}), 200
        print("Image processing failed")  # Niepowodzenie
        return jsonify({'message': 'Image processing failed'}), 400



    @app.route('/mine', methods=['GET'])
    def mine():
        # Check if already mining
        if blockchain.mining_status["is_mining"]:
            return jsonify({
                'success': False,
                'message': 'Mining already in progress',
                'progress': blockchain.mining_status["progress"],
                'confirmations': len(blockchain.pending_transactions)
            }), 409

        result = blockchain.mine_pending_transactions()
        
        if result["success"]:
            return jsonify(result), 200
        else:
            return jsonify(result), 400
        

    @app.route('/chain', methods=['GET'])
    def get_chain():
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
        """Simulate node failure"""
        data = request.get_json()
        failure_type = data.get('type', 'node_down')
        
        if failure_type == 'node_down':
            # Simulate complete node failure
            os._exit(1)
        
        elif failure_type == 'network_delay':
            # Simulate network latency
            time.sleep(10)
            return jsonify({'message': 'Network delay simulated'})
        
        elif failure_type == 'data_corruption':
            # Simulate CRC corruption
            for transaction in blockchain.pending_transactions:
                transaction.crc = 'corrupted'
            return jsonify({'message': 'Data corruption simulated'})
            
        return jsonify({'message': 'Unknown failure type'})

    return app