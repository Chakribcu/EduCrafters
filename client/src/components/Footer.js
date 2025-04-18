import React from 'react';
import { Link } from 'wouter';

const Footer = () => {
  return (
    <footer className="bg-neutral-800 text-neutral-300 py-12">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          <div>
            <div className="flex items-center mb-4">
              <span className="material-icons text-primary text-3xl mr-2">school</span>
              <h2 className="text-2xl font-bold text-white">EduCrafters</h2>
            </div>
            <p className="mb-4">Your gateway to quality online education. Learn from expert instructors and advance your skills at your own pace.</p>
            <div className="flex space-x-4">
              <a href="#" className="text-neutral-300 hover:text-white transition"><span className="material-icons">facebook</span></a>
              <a href="#" className="text-neutral-300 hover:text-white transition"><span className="material-icons">twitter</span></a>
              <a href="#" className="text-neutral-300 hover:text-white transition"><span className="material-icons">instagram</span></a>
              <a href="#" className="text-neutral-300 hover:text-white transition"><span className="material-icons">linkedin</span></a>
            </div>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Explore</h3>
            <ul className="space-y-2">
              <li><Link href="/courses"><a className="hover:text-white transition">All Courses</a></Link></li>
              <li><a href="#" className="hover:text-white transition">Browse Categories</a></li>
              <li><a href="#" className="hover:text-white transition">Trending Courses</a></li>
              <li><Link href="/register"><a className="hover:text-white transition">Become an Instructor</a></Link></li>
              <li><a href="#" className="hover:text-white transition">Success Stories</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Information</h3>
            <ul className="space-y-2">
              <li><a href="#" className="hover:text-white transition">About Us</a></li>
              <li><a href="#" className="hover:text-white transition">Blog</a></li>
              <li><a href="#" className="hover:text-white transition">FAQs</a></li>
              <li><a href="#" className="hover:text-white transition">Contact Us</a></li>
              <li><a href="#" className="hover:text-white transition">Terms of Service</a></li>
              <li><a href="#" className="hover:text-white transition">Privacy Policy</a></li>
            </ul>
          </div>
          
          <div>
            <h3 className="text-lg font-bold mb-4 text-white">Contact</h3>
            <ul className="space-y-2">
              <li className="flex items-start">
                <span className="material-icons mr-2 mt-1">location_on</span>
                <span>123 Education Street, Learning City, ED 12345</span>
              </li>
              <li className="flex items-center">
                <span className="material-icons mr-2">email</span>
                <span>support@eduCrafters.com</span>
              </li>
              <li className="flex items-center">
                <span className="material-icons mr-2">phone</span>
                <span>+1 (234) 567-8909</span>
              </li>
            </ul>
            <div className="mt-4">
              <h4 className="font-medium mb-2 text-white">Subscribe to our newsletter</h4>
              <div className="flex">
                <input type="email" placeholder="Your email" className="px-4 py-2 rounded-l-md focus:outline-none bg-neutral-700 border-none text-white w-full" />
                <button className="bg-primary hover:bg-primary-dark text-white px-4 py-2 rounded-r-md transition">
                  <span className="material-icons">send</span>
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <div className="border-t border-neutral-700 mt-8 pt-8 text-center">
          <p>&copy; {new Date().getFullYear()} EduCrafters. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;