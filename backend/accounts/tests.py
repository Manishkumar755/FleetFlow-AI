from django.contrib.auth import get_user_model
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase
from rest_framework_simplejwt.tokens import RefreshToken

User = get_user_model()


class AuthAndUserTests(APITestCase):
    def setUp(self):
        self.admin_user = User.objects.create_superuser(
            username='admin_test',
            email='admin@fleetflow.io',
            password='Password123!',
            role='ADMIN'
        )
        self.manager_user = User.objects.create_user(
            username='manager_test',
            email='mgr@fleetflow.io',
            password='Password123!',
            role='MANAGER'
        )
        self.driver_user = User.objects.create_user(
            username='driver_test',
            email='driver@fleetflow.io',
            password='Password123!',
            role='DRIVER'
        )
        self.customer_user = User.objects.create_user(
            username='customer_test',
            email='cust@fleetflow.io',
            password='Password123!',
            role='CUSTOMER'
        )

    def test_user_registration_success(self):
        payload = {
            'username': 'newuser',
            'email': 'newuser@example.com',
            'password': 'StrongPassword123!',
            'password2': 'StrongPassword123!',
            'role': 'CUSTOMER',
            'phone': '+1234567890'
        }
        response = self.client.post(reverse('register'), payload, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn('access', response.data)
        self.assertIn('refresh', response.data)
        self.assertEqual(response.data['user']['username'], 'newuser')

    def test_user_login_success(self):
        payload = {
            'username': 'admin_test',
            'password': 'Password123!'
        }
        response = self.client.post(reverse('login'), payload)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)
        self.assertEqual(response.data['user']['role'], 'ADMIN')

    def test_user_login_invalid_password(self):
        payload = {
            'username': 'admin_test',
            'password': 'WrongPassword!'
        }
        response = self.client.post(reverse('login'), payload)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_me_endpoint_authenticated(self):
        self.client.force_authenticate(user=self.manager_user)
        response = self.client.get(reverse('me'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data['username'], 'manager_test')
        self.assertEqual(response.data['role'], 'MANAGER')

    def test_me_endpoint_patch(self):
        self.client.force_authenticate(user=self.customer_user)
        response = self.client.patch(reverse('me'), {'phone': '+9998887777'})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.customer_user.refresh_from_db()
        self.assertEqual(self.customer_user.phone, '+9998887777')

    def test_token_refresh(self):
        refresh = RefreshToken.for_user(self.customer_user)
        response = self.client.post(reverse('token_refresh'), {'refresh': str(refresh)})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('access', response.data)

    def test_users_list_rbac(self):
        # Admin allowed
        self.client.force_authenticate(user=self.admin_user)
        res_admin = self.client.get(reverse('users_list'))
        self.assertEqual(res_admin.status_code, status.HTTP_200_OK)
        self.assertGreaterEqual(len(res_admin.data), 4)

        # Customer forbidden
        self.client.force_authenticate(user=self.customer_user)
        res_cust = self.client.get(reverse('users_list'))
        self.assertEqual(res_cust.status_code, status.HTTP_403_FORBIDDEN)

    def test_update_user_role_admin_only(self):
        self.client.force_authenticate(user=self.admin_user)
        res = self.client.patch(
            reverse('update_user_role', kwargs={'pk': self.customer_user.pk}),
            {'role': 'MANAGER'}
        )
        self.assertEqual(res.status_code, status.HTTP_200_OK)
        self.customer_user.refresh_from_db()
        self.assertEqual(self.customer_user.role, 'MANAGER')

        # Non-admin cannot change roles
        self.client.force_authenticate(user=self.manager_user)
        res_fail = self.client.patch(
            reverse('update_user_role', kwargs={'pk': self.customer_user.pk}),
            {'role': 'ADMIN'}
        )
        self.assertEqual(res_fail.status_code, status.HTTP_403_FORBIDDEN)
