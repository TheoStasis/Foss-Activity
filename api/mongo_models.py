from mongoengine import Document, StringField, IntField, FloatField, DictField, DateTimeField, ListField
import datetime

class UserDataset(Document):
    """Store datasets with user association"""
    user = StringField(required=True)  # username
    filename = StringField(required=True)
    stats = DictField(required=True)
    file_path = StringField()
    uploaded_at = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {
        'collection': 'user_datasets',
        'indexes': ['user', 'uploaded_at']  # Index for fast queries
    }

class UserProfile(Document):
    """Track user information"""
    username = StringField(required=True, unique=True)
    email = StringField()
    created_at = DateTimeField(default=datetime.datetime.utcnow)
    
    meta = {
        'collection': 'user_profiles'
    }
