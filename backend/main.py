from flask import Flask, jsonify, request
import hashlib
import time
import json
import threading
import requests
import psycopg2
from psycopg2.extras import RealDictCursor
from werkzeug.security import generate_password_hash, check_password_hash
import jwt

app = Flask(__name__)
app.config['SECRET_KEY'] = 'your_secret_key'

NUM_NODES = 6  # Number of nodes in the network
MAJORITY_NODES = 4  # Majority approval required (e.g., 4 out of 6 nodes)

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
            'transactions': self.transactions,
            'timestamp': self.timestamp,
            'nonce': self.nonce
        }, sort_keys=True).encode()
        return hashlib.sha256(block_string).hexdigest()

    def mine_block(self):
        while True:
            self.nonce += 1
            self.hash = self.calculate_hash()
            if self.is_block_valid():
                break

    def is_block_valid(self):
        # Validate if transactions are approved by majority of nodes
        return sum(self.is_transaction_approved(tx) for tx in self.transactions) >= MAJORITY_NODES

    def is_transaction_approved(self, transaction):
        approvals = 0
        for node_id in range(1, NUM_NODES + 1):
            try:
                connection = connect_to_db(node_id)
                with connection.cursor() as cursor:
                    cursor.execute("SELECT COUNT(*) FROM photos WHERE user_id = %s AND photo_data = %s AND metadata = %s", (
                        transaction['user_id'], transaction['photo_data'], transaction['metadata']
                    ))
                    count = cursor.fetchone()[0]
                    if count > 0:
                        approvals += 1
            except:
                continue
        return approvals >= MAJORITY_NODES

class Blockchain:
    def __init__(self):
        self.chain = [self.create_genesis_block()]
        self.pending_transactions = []

    def create_genesis_block(self):
        return Block(0, "0", "Genesis Block")

    def add_transaction(self, transaction):
        self.pending_transactions.append(transaction)
        if len(self.pending_transactions) >= MAJORITY_NODES:
            self.mine_pending_transactions()

    def mine_pending_transactions(self):
        block = Block(len(self.chain), self.chain[-1].hash, self.pending_transactions)
        block.mine_block()
        self.chain.append(block)
        self.pending_transactions = []

def connect_to_db(node_id):
    return psycopg2.connect(
        host="localhost",
        port=f"5432{node_id}",
        database="photos_db",
        user="user",
        password="password"
    )

blockchain = Blockchain()

@app.route('/register', methods=['POST'])
def register_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')
    hashed_password = generate_password_hash(password)

    connection = connect_to_db(1)
    with connection.cursor() as cursor:
        cursor.execute("INSERT INTO users (username, password) VALUES (%s, %s)", (username, hashed_password))
        connection.commit()

    return jsonify({'message': 'User registered successfully'})

@app.route('/login', methods=['POST'])
def login_user():
    data = request.get_json()
    username = data.get('username')
    password = data.get('password')

    connection = connect_to_db(1)
    with connection.cursor() as cursor:
        cursor.execute("SELECT * FROM users WHERE username = %s", (username,))
        user = cursor.fetchone()
        if user and check_password_hash(user['password'], password):
            token = jwt.encode({'username': username}, app.config['SECRET_KEY'])
            return jsonify({'token': token})
        else:
            return jsonify({'error': 'Invalid credentials'}), 401

@app.route('/photos', methods=['POST'])
def add_photo():
    data = request.get_json()
    user_id = data['user_id']
    photo_data = data['photo_data']
    metadata = data['metadata']

    transaction = {'user_id': user_id, 'photo_data': photo_data, 'metadata': metadata}
    blockchain.add_transaction(transaction)

    if len(blockchain.pending_transactions) == 0:
        return jsonify({'message': 'Photo added successfully!'})
    else:
        return jsonify({'error': 'Transaction pending approval by all nodes.'})

@app.route('/photos/<user_id>', methods=['GET'])
def get_photos(user_id):
    photos = []
    for node_id in range(1, NUM_NODES + 1):
        try:
            connection = connect_to_db(node_id)
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM photos WHERE user_id = %s", (user_id,))
                photos.extend(cursor.fetchall())
        except:
            continue
    return jsonify(photos)

@app.route('/photos/<user_id>/<photo_id>', methods=['GET'])
def get_photo(user_id, photo_id):
    for node_id in range(1, NUM_NODES + 1):
        try:
            connection = connect_to_db(node_id)
            with connection.cursor(cursor_factory=RealDictCursor) as cursor:
                cursor.execute("SELECT * FROM photos WHERE user_id = %s AND id = %s", (user_id, photo_id))
                photo = cursor.fetchone()
                if photo:
                    return jsonify(photo)
        except:
            continue
    return jsonify({'error': 'Photo not found'}), 404

def auto_register_nodes():
    nodes = ['127.0.0.1:5002', '127.0.0.1:5003', '127.0.0.1:5004', '127.0.0.1:5005']
    for node in nodes:
        try:
            requests.post(f'http://127.0.0.1:5001/nodes/register', json={'nodes': [node]})
        except:
            print(f"Failed to connect to {node}")

threading.Thread(target=auto_register_nodes).start()

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5001)
