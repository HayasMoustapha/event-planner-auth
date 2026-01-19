const request = require('supertest');
const app = require('./src/app');
const bootstrap = require('./src/bootstrap');

async function debugUsers() {
    await bootstrap.initialize();

    // Login as admin
    const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
            email: 'admin@eventplanner.com',
            password: 'admin123'
        });

    console.log('Login status:', loginResponse.status);
    const token = loginResponse.body.data.token;

    const response = await request(app)
        .get('/api/users?page=1&limit=10')
        .set('Authorization', `Bearer ${token}`);

    console.log('Users response status:', response.status);
    console.log('Users response body:', JSON.stringify(response.body, null, 2));

    process.exit(0);
}

debugUsers().catch(err => {
    console.error(err);
    process.exit(1);
});
