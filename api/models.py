from django.db import models
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.fields import ArrayField

class User(AbstractUser):
    department = models.CharField(max_length=100, null=True, blank=True)
    avatar = models.CharField(max_length=255, null=True, blank=True)
    role = models.CharField(max_length=50, default="professor")
    join_date = models.DateTimeField(auto_now_add=True)
    timezone = models.CharField(max_length=50, null=True, blank=True)
    language = models.CharField(max_length=50, default="English")
    
    def __str__(self):
        return self.username

class Course(models.Model):
    name = models.CharField(max_length=100)
    code = models.CharField(max_length=20, unique=True)
    description = models.TextField(null=True, blank=True)
    instructor = models.ForeignKey(User, on_delete=models.CASCADE, related_name='courses')
    status = models.CharField(max_length=50, default="on-track")
    week = models.IntegerField(default=1)
    progress = models.IntegerField(default=0)
    credits = models.IntegerField(default=3)
    average = models.FloatField(default=0)
    attendance = models.FloatField(default=0)
    pass_rate = models.FloatField(default=0)
    class_average = models.FloatField(default=0)
    total_students = models.IntegerField(default=0)
    at_risk_count = models.IntegerField(default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.code} - {self.name}"

class Student(models.Model):
    name = models.CharField(max_length=100)
    email = models.EmailField(unique=True)
    avatar = models.CharField(max_length=255, null=True, blank=True)
    score = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    average = models.FloatField(default=0)
    attendance = models.FloatField(default=0)
    submissions = models.IntegerField(default=0)
    last_submission = models.DateTimeField(null=True, blank=True)
    status = models.CharField(max_length=50, default="Good")
    trend = models.CharField(max_length=50, default="stable")
    badges = ArrayField(models.CharField(max_length=100), default=list, blank=True)
    progress = models.IntegerField(default=0)
    streak = models.IntegerField(default=0)
    grade = models.CharField(max_length=10, default="N/A")
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='students')
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.name

class Event(models.Model):
    title = models.CharField(max_length=100)
    date = models.DateTimeField()
    time = models.CharField(max_length=10, null=True, blank=True)
    type = models.CharField(max_length=50)
    description = models.TextField(null=True, blank=True)
    course = models.ForeignKey(Course, on_delete=models.CASCADE, related_name='events', null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return self.title
