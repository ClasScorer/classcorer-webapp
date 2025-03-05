from django.contrib import admin
from django.contrib.auth import get_user_model
from .models import Course, Student, Event

User = get_user_model()

@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ('username', 'email', 'first_name', 'last_name', 'role', 'department')
    search_fields = ('username', 'email', 'first_name', 'last_name')
    list_filter = ('role',)

@admin.register(Course)
class CourseAdmin(admin.ModelAdmin):
    list_display = ('code', 'name', 'instructor', 'status', 'week', 'progress')
    search_fields = ('code', 'name')
    list_filter = ('status',)

@admin.register(Student)
class StudentAdmin(admin.ModelAdmin):
    list_display = ('name', 'email', 'course', 'status', 'level', 'average')
    search_fields = ('name', 'email')
    list_filter = ('status', 'course')

@admin.register(Event)
class EventAdmin(admin.ModelAdmin):
    list_display = ('title', 'date', 'type', 'course')
    search_fields = ('title',)
    list_filter = ('type', 'course')
