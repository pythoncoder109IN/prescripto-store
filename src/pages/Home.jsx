import React from 'react'
import { Link } from 'react-router-dom'
import { 
  Upload, 
  Shield, 
  Truck, 
  Clock, 
  Star,
  ArrowRight,
  CheckCircle,
  Users,
  Award
} from 'lucide-react'
import ProductCard from '../components/common/ProductCard'

// Mock data for featured products
const featuredProducts = [
  {
    id: 1,
    name: "Paracetamol 500mg",
    description: "Pain relief and fever reducer",
    price: 12.99,
    originalPrice: 15.99,
    discount: 20,
    image: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 4.5,
    reviews: 128,
    inStock: true,
    prescriptionRequired: false
  },
  {
    id: 2,
    name: "Vitamin D3 1000 IU",
    description: "Bone health supplement",
    price: 24.99,
    image: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 4.8,
    reviews: 89,
    inStock: true,
    prescriptionRequired: false
  },
  {
    id: 3,
    name: "Amoxicillin 250mg",
    description: "Antibiotic for bacterial infections",
    price: 18.99,
    image: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 4.6,
    reviews: 67,
    inStock: true,
    prescriptionRequired: true
  },
  {
    id: 4,
    name: "Omega-3 Fish Oil",
    description: "Heart and brain health supplement",
    price: 29.99,
    originalPrice: 34.99,
    discount: 15,
    image: "https://images.pexels.com/photos/3683074/pexels-photo-3683074.jpeg?auto=compress&cs=tinysrgb&w=400",
    rating: 4.7,
    reviews: 156,
    inStock: true,
    prescriptionRequired: false
  }
]

const stats = [
  { label: "Happy Customers", value: "50,000+", icon: Users },
  { label: "Medicines Available", value: "10,000+", icon: Award },
  { label: "Years of Trust", value: "15+", icon: Shield },
  { label: "Cities Served", value: "100+", icon: Truck }
]

export default function Home() {
  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="medical-gradient py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-8">
              <div className="space-y-4">
                <h1 className="text-4xl md:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight">
                  Your Health,
                  <span className="text-primary-600"> Our Priority</span>
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Get authentic medicines delivered to your doorstep. Upload your prescription 
                  and let our licensed pharmacists take care of the rest.
                </p>
              </div>

              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  to="/prescription-upload"
                  className="btn-primary flex items-center justify-center space-x-2 text-lg px-8 py-4"
                >
                  <Upload className="w-5 h-5" />
                  <span>Upload Prescription</span>
                </Link>
                <Link
                  to="/products"
                  className="btn-secondary flex items-center justify-center space-x-2 text-lg px-8 py-4"
                >
                  <span>Browse Products</span>
                  <ArrowRight className="w-5 h-5" />
                </Link>
              </div>

              {/* Trust Indicators */}
              <div className="flex items-center space-x-6 pt-4">
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Licensed Pharmacy</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">100% Authentic</span>
                </div>
                <div className="flex items-center space-x-2">
                  <CheckCircle className="w-5 h-5 text-green-500" />
                  <span className="text-sm text-gray-600">Fast Delivery</span>
                </div>
              </div>
            </div>

            <div className="relative">
              <img
                src="https://images.pexels.com/photos/4021775/pexels-photo-4021775.jpeg?auto=compress&cs=tinysrgb&w=800"
                alt="Healthcare professional"
                className="rounded-2xl shadow-2xl"
              />
              <div className="absolute -bottom-6 -left-6 bg-white p-6 rounded-xl shadow-lg">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Shield className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-900">FDA Approved</p>
                    <p className="text-sm text-gray-600">All medicines verified</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <stat.icon className="w-8 h-8 text-primary-600" />
                </div>
                <div className="text-3xl font-bold text-gray-900 mb-2">{stat.value}</div>
                <div className="text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
              Why Choose MedCare?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              We're committed to providing you with the best healthcare experience 
              through technology and trusted service.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Upload className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Easy Prescription Upload
              </h3>
              <p className="text-gray-600">
                Simply take a photo of your prescription and upload it. Our AI will 
                process it instantly.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Shield className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                100% Authentic
              </h3>
              <p className="text-gray-600">
                All medicines are sourced directly from licensed manufacturers 
                and verified for authenticity.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Truck className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Fast Delivery
              </h3>
              <p className="text-gray-600">
                Get your medicines delivered within 24 hours with our express 
                delivery service.
              </p>
            </div>

            <div className="card text-center">
              <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                <Clock className="w-8 h-8 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                24/7 Support
              </h3>
              <p className="text-gray-600">
                Our licensed pharmacists are available round the clock to 
                answer your queries.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center mb-12">
            <div>
              <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">
                Featured Products
              </h2>
              <p className="text-xl text-gray-600">
                Popular medicines and health products
              </p>
            </div>
            <Link
              to="/products"
              className="btn-secondary flex items-center space-x-2"
            >
              <span>View All</span>
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} product={product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-primary-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="max-w-3xl mx-auto">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
              Ready to Get Started?
            </h2>
            <p className="text-xl text-primary-100 mb-8">
              Join thousands of satisfied customers who trust MedCare for their 
              healthcare needs. Upload your prescription today!
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/prescription-upload"
                className="bg-white text-primary-600 hover:bg-gray-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center justify-center space-x-2"
              >
                <Upload className="w-5 h-5" />
                <span>Upload Prescription</span>
              </Link>
              <Link
                to="/register"
                className="bg-transparent border-2 border-white text-white hover:bg-white hover:text-primary-600 font-medium py-3 px-8 rounded-lg transition-colors duration-200"
              >
                Create Account
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  )
}