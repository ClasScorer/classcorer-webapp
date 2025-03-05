from django.shortcuts import render
from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.authtoken.models import Token
from django.contrib.auth import get_user_model, authenticate, login, logout
from django.contrib.auth.hashers import make_password
from .models import Course, Student, Event
from .serializers import (
    UserSerializer, 
    CourseSerializer, 
    StudentSerializer, 
    EventSerializer,
    RegisterSerializer,
    SignupSerializer
)

User = get_user_model()

class CourseViewSet(viewsets.ModelViewSet):
    queryset = Course.objects.all()
    serializer_class = CourseSerializer
    
    def get_queryset(self):
        queryset = Course.objects.all()
        # Add filtering options if needed
        return queryset

class StudentViewSet(viewsets.ModelViewSet):
    queryset = Student.objects.all()
    serializer_class = StudentSerializer
    
    def get_queryset(self):
        queryset = Student.objects.all()
        # Add filtering options if needed
        return queryset

class EventViewSet(viewsets.ModelViewSet):
    queryset = Event.objects.all()
    serializer_class = EventSerializer
    
    def get_queryset(self):
        queryset = Event.objects.all().order_by('date')
        # Add filtering options if needed
        return queryset

class UserViewSet(viewsets.ReadOnlyModelViewSet):
    queryset = User.objects.all()
    serializer_class = UserSerializer
    
    def get_queryset(self):
        queryset = User.objects.all()
        # Add filtering options if needed
        return queryset

@api_view(['GET'])
def current_user(request):
    """
    Get the current user
    """
    serializer = UserSerializer(request.user)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def register_user(request):
    """
    Register a new user
    """
    serializer = RegisterSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def login_user(request):
    """
    Login a user
    """
    email = request.data.get('email', '')
    password = request.data.get('password', '')
    
    # First try to get the user by email
    try:
        user = User.objects.get(email=email)
        # Then authenticate with the username and password
        user = authenticate(request, username=user.username, password=password)
        
        if user:
            login(request, user)
            token, _ = Token.objects.get_or_create(user=user)
            return Response({
                'token': token.key,
                'user': UserSerializer(user).data
            })
    except User.DoesNotExist:
        pass
    
    return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)

@api_view(['POST'])
def logout_user(request):
    """
    Logout a user
    """
    logout(request)
    return Response({'message': 'Successfully logged out'})

@api_view(['POST'])
@permission_classes([permissions.AllowAny])
def signup_user(request):
    """
    Sign up a new user with validation
    """
    serializer = SignupSerializer(data=request.data)
    if serializer.is_valid():
        user = serializer.save()
        # Create token for the new user
        token, _ = Token.objects.get_or_create(user=user)
        # Log the user in
        login(request, user)
        return Response({
            'token': token.key,
            'user': UserSerializer(user).data,
            'message': 'User registered successfully'
        }, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
