import React, { useState } from 'react';
import { Star, Clock, ArrowRight, Filter, Search } from 'lucide-react';
import { ServiceItem } from '../types';

interface ServiceListingProps {
  onBookService: (serviceId: string) => void;
}

import { MASTER_SERVICES as services, CATEGORIES as categories } from '../constants/services';

const ServiceListing: React.FC<ServiceListingProps> = ({ onBookService }) => {
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');

  const filteredServices = services.filter(service => {
    const matchesCategory = selectedCategory === 'All' || service.category === selectedCategory;
    const matchesSearch = service.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-900">Our Services</h2>
          <p className="text-slate-600 mt-1">Professional help for every corner of your home.</p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search services..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9 pr-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none w-full"
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-2.5 text-slate-400 w-4 h-4" />
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="pl-9 pr-8 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:outline-none appearance-none bg-white w-full"
            >
              {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredServices.map((service) => (
          <div key={service.id} className="bg-white rounded-xl shadow-sm border border-slate-200 hover:shadow-md transition-shadow overflow-hidden flex flex-col">
            <div className={`h-32 ${service.color} flex items-center justify-center`}>
              <span className="text-4xl font-bold opacity-20">{service.name.charAt(0)}</span>
            </div>
            <div className="p-6 flex-1 flex flex-col">
              <div className="flex justify-between items-start mb-2">
                <span className="text-xs font-semibold px-2 py-1 bg-slate-100 text-slate-600 rounded-full">{service.category}</span>
                <div className="flex items-center gap-1 text-sm font-medium text-slate-700">
                  <Star className="w-4 h-4 text-yellow-500 fill-current" />
                  {service.rating} <span className="text-slate-400">({service.reviews})</span>
                </div>
              </div>
              <h3 className="text-xl font-bold text-slate-900 mb-2">{service.name}</h3>
              <p className="text-slate-600 text-sm mb-4 flex-1">{service.description}</p>

              <div className="flex items-center justify-between pt-4 border-t border-slate-100">
                <div>
                  <span className="text-xs text-slate-500 block">Starts at</span>
                  <span className="text-lg font-bold text-slate-900">₹{service.basePrice}</span>
                </div>
                <button
                  onClick={() => onBookService(service.id)}
                  className="bg-indigo-600 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-indigo-700 transition-colors flex items-center gap-1"
                >
                  Book Now <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ServiceListing;
