from rest_framework.authentication import BaseAuthentication
from rest_framework import exceptions
from django.contrib.auth import get_user_model
from django.contrib.auth.hashers import check_password
from django.db.models import Q

User = get_user_model()

class EmailOrUsernameModelBackend(BaseAuthentication):
    """
    Authentication backend which allows users to authenticate using either their
    username or email address and password.
    """
    def authenticate(self, request, username=None, password=None, **kwargs):
        if username is None or password is None:
            return None
        
        try:
            # Try to find the user by username or email
            user = User.objects.get(Q(username=username) | Q(email=username))
            
            # Check the password
            if user.check_password(password):
                return user
        except User.DoesNotExist:
            return None
        
        return None 