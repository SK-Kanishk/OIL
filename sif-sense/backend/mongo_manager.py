"""
SIF-Sense AI — MongoDB Integration Manager
Connects to MongoDB Atlas / local MongoDB with user credentials.
Provides real-time connection testing, document persistence, and status telemetry.
"""

import os
import logging
from datetime import datetime
from typing import Optional, Dict, Any, List
from pymongo import MongoClient
from pymongo.errors import ConnectionFailure, ServerSelectionTimeoutError

logger = logging.getLogger("sif_sense.mongodb")

DEFAULT_USER = "kanishkskcet_db_user"
DEFAULT_PASS = "ifFUpRNfU7w1OpB4"
DEFAULT_DBNAME = "sif_sense"

class MongoManager:
    def __init__(self):
        self.user = os.getenv("MONGODB_USER", DEFAULT_USER)
        self.password = os.getenv("MONGODB_PASS", DEFAULT_PASS)
        self.host = os.getenv("MONGODB_HOST", "cluster0.mongodb.net")
        self.dbname = os.getenv("MONGODB_DBNAME", DEFAULT_DBNAME)
        self.uri = os.getenv("MONGODB_URI")

        self.client: Optional[MongoClient] = None
        self.db = None
        self.is_connected = False
        self.last_error = None

        # Build URI if not provided directly
        if not self.uri:
            self.uri = f"mongodb+srv://{self.user}:{self.password}@{self.host}/{self.dbname}?retryWrites=true&w=majority"

        self.connect()

    def connect(self, custom_uri: Optional[str] = None):
        """Attempt to connect to MongoDB."""
        target_uri = custom_uri or self.uri
        try:
            logger.info("Attempting connection to MongoDB...")
            # Short timeout so server startup is never blocked
            self.client = MongoClient(target_uri, serverSelectionTimeoutMS=4000)
            # Trigger server check
            self.client.admin.command('ping')
            self.db = self.client[self.dbname]
            self.is_connected = True
            self.last_error = None
            self.uri = target_uri
            logger.info(f"Connected successfully to MongoDB ({self.dbname})!")
            return True, "Connected successfully"
        except (ConnectionFailure, ServerSelectionTimeoutError, Exception) as e:
            self.is_connected = False
            self.last_error = str(e)
            logger.warning(f"MongoDB connection notice: {e}. Fallback SQLite active.")
            return False, str(e)

    def get_status(self) -> Dict[str, Any]:
        """Return real-time connection status."""
        return {
            "connected": self.is_connected,
            "database_type": "MongoDB Atlas" if self.is_connected else "SQLite (Local Fallback)",
            "user": self.user,
            "database_name": self.dbname,
            "error": self.last_error if not self.is_connected else None,
            "active_host": self.host,
            "timestamp": datetime.utcnow().isoformat()
        }

    def save_report(self, report_dict: Dict[str, Any]):
        """Persist report to MongoDB if connected."""
        if not self.is_connected or self.db is None:
            return None
        try:
            doc = {**report_dict, "created_at": datetime.utcnow()}
            res = self.db.reports.insert_one(doc)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f"Failed to save report in MongoDB: {e}")
            return None

    def save_alert(self, alert_dict: Dict[str, Any]):
        """Persist alert to MongoDB if connected."""
        if not self.is_connected or self.db is None:
            return None
        try:
            doc = {**alert_dict, "created_at": datetime.utcnow()}
            res = self.db.alerts.insert_one(doc)
            return str(res.inserted_id)
        except Exception as e:
            logger.error(f"Failed to save alert in MongoDB: {e}")
            return None


mongo_manager = MongoManager()
