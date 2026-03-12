import PocketBase from 'pocketbase';

// onde o banco está rodando (Docker)
const pb = new PocketBase('http://localhost:8090');

export default pb;