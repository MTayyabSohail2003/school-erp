import { createParentAction } from '../features/parents/api/create-parent.action';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env' });

async function run() {
    const res = await createParentAction({
        full_name: 'Test Action Parent',
        email: 'action_parent_' + Date.now() + '@example.com',
        phone_number: '12345678901',
        password: 'password123',
    });
    console.log('Result:', res);
}

run();
