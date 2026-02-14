import { ServiceItem } from '../types';

export const MASTER_SERVICES: ServiceItem[] = [
    {
        id: 'cleaning',
        name: 'Deep Home Cleaning',
        category: 'Cleaning',
        basePrice: 499,
        rating: 4.8,
        reviews: 1240,
        description: 'Complete home sanitization including floor scrubbing, dusting, and bathroom cleaning.',
        color: 'bg-blue-100 text-blue-700'
    },
    {
        id: 'plumbing',
        name: 'Expert Plumbing Repair',
        category: 'Repair',
        basePrice: 599,
        rating: 4.7,
        reviews: 850,
        description: 'Fix leaks, unclog drains, or install new fixtures with certified plumbers.',
        color: 'bg-cyan-100 text-cyan-700'
    },
    {
        id: 'electrical',
        name: 'Electrical Maintenance',
        category: 'Repair',
        basePrice: 549,
        rating: 4.9,
        reviews: 920,
        description: 'Safety checks, wiring repairs, and appliance installation by certified electricians.',
        color: 'bg-yellow-100 text-yellow-700'
    },
    {
        id: 'moving',
        name: 'Packers & Movers',
        category: 'Moving',
        basePrice: 4999,
        rating: 4.6,
        reviews: 430,
        description: 'Hassle-free shifting with professional packaging and safe transportation.',
        color: 'bg-orange-100 text-orange-700'
    },
    {
        id: 'painting',
        name: 'Wall Painting',
        category: 'Home Improvement',
        basePrice: 14999,
        rating: 4.5,
        reviews: 210,
        description: 'Refresh your home with premium eco-friendly paints and expert application.',
        color: 'bg-purple-100 text-purple-700'
    },
    {
        id: 'pest',
        name: 'Pest Control',
        category: 'Cleaning',
        basePrice: 899,
        rating: 4.8,
        reviews: 600,
        description: 'Odorless and safe pest control treatments for cockroaches, ants, and termites.',
        color: 'bg-green-100 text-green-700'
    }
];

export const CATEGORIES = ['All', 'Cleaning', 'Repair', 'Moving', 'Home Improvement'];
