from flask import Flask
import os
from blockchain_node import create_blockchain_app
from user_management import create_user_app
from werkzeug.middleware.dispatcher import DispatcherMiddleware
import multiprocessing
import time
from dotenv import load_dotenv

load_dotenv()

def create_app():
    """Create the main application with both blockchain and user management"""
    app = Flask(__name__)
    
    # Create blockchain and user management apps
    blockchain_app = create_blockchain_app()
    user_app = create_user_app()
    
    # Combine apps using middleware
    app.wsgi_app = DispatcherMiddleware(app.wsgi_app, {
        '/blockchain': blockchain_app,
        '/user': user_app
    })
    
    return app

def start_node(port):
    """Start a blockchain node on the specified port"""
    app = create_app()
    app.run(host='0.0.0.0', port=port)

def start_network(num_nodes=6, start_port=5001):
    """Start the specified number of blockchain nodes"""
    processes = []
    for i in range(num_nodes):
        port = start_port + i
        process = multiprocessing.Process(
            target=start_node,
            args=(port,)
        )
        process.start()
        processes.append(process)
    return processes

if __name__ == '__main__':
    # Get port from environment variable or use default
    port = int(os.getenv('PORT', 5001))
    node_id = os.getenv('NODE_ID', 'node1')
    
    # Start single node
    app = create_app()
    app.run(host='0.0.0.0', port=port)