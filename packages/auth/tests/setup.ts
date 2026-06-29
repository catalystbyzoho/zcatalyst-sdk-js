/**
 * Test Setup for @zcatalyst/auth
 */

// Mock fetch
global.fetch = jest.fn();

// Mock document.cookie
Object.defineProperty(document, 'cookie', {
	writable: true,
	value: ''
});

// Mock document.getElementById
document.getElementById = jest.fn((id: string) => {
	const elem = document.createElement('div');
	elem.id = id;
	return elem;
});

// Mock window.location
delete (window as any).location;
window.location = {
	href: 'http://localhost:3000',
	origin: 'http://localhost:3000',
	protocol: 'http:',
	host: 'localhost:3000',
	hostname: 'localhost',
	port: '3000',
	pathname: '/',
	search: '',
	hash: '',
	replace: jest.fn()
} as any;

afterEach(() => {
	jest.clearAllMocks();
	(global.fetch as jest.Mock).mockClear();
	document.cookie = '';
	document.body.innerHTML = '';
});
