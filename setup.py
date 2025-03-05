import os
import django
from django.core.management import call_command

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'backend.settings')
django.setup()

def setup():
    """
    Run migrations and create a superuser if it doesn't exist
    """
    # Run migrations
    call_command('makemigrations')
    call_command('migrate')
    
    # Create a superuser if it doesn't exist
    from django.contrib.auth import get_user_model
    User = get_user_model()
    
    if not User.objects.filter(username='admin').exists():
        User.objects.create_superuser(
            username='admin',
            email='admin@example.com',
            password='admin',
            first_name='Admin',
            last_name='User',
            role='admin'
        )
        print('Superuser created successfully!')
    else:
        print('Superuser already exists.')
    
    print('Setup completed successfully!')

if __name__ == '__main__':
    setup() 