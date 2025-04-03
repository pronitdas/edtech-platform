import React, { useState } from 'react';
import { Button } from '../../components/ui/button';
import { Link } from 'react-router-dom';

type ButtonVariant = 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';

interface PricingTier {
  name: string;
  description: string;
  monthlyPrice: number;
  yearlyPrice: number;
  features: string[];
  highlighted: boolean;
  buttonText: string;
  buttonVariant: ButtonVariant;
}

const PricingPage = () => {
  const [billingPeriod, setBillingPeriod] = useState('monthly');

  const pricingTiers: PricingTier[] = [
    {
      name: 'Basic',
      description: 'Perfect for individual learners',
      monthlyPrice: 9.99,
      yearlyPrice: 99.99,
      features: [
        'Access to basic courses',
        'Interactive quizzes',
        'Learning progress tracking',
        'Mobile access',
        'Email support'
      ],
      highlighted: false,
      buttonText: 'Get Started',
      buttonVariant: 'outline'
    },
    {
      name: 'Pro',
      description: 'Ideal for dedicated students',
      monthlyPrice: 19.99,
      yearlyPrice: 199.99,
      features: [
        'All Basic features',
        'Advanced analytics dashboard',
        'Personalized learning paths',
        'Downloadable resources',
        'Priority email support',
        'Monthly progress reports'
      ],
      highlighted: true,
      buttonText: 'Get Started',
      buttonVariant: 'default'
    },
    {
      name: 'Enterprise',
      description: 'For teams and organizations',
      monthlyPrice: 49.99,
      yearlyPrice: 499.99,
      features: [
        'All Pro features',
        'Team management dashboard',
        'Advanced analytics',
        'Custom learning paths',
        'API access',
        'Dedicated account manager',
        'Phone and email support'
      ],
      highlighted: false,
      buttonText: 'Contact Us',
      buttonVariant: 'outline'
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-white">
      {/* Navigation */}
      <nav className="container mx-auto px-6 py-4">
        <div className="flex justify-between items-center">
          <Link to="/" className="text-3xl font-bold text-blue-600">Ai Study Tools</Link>
          <div className="hidden md:flex space-x-8 items-center">
            <Link to="/#features" className="text-gray-700 hover:text-blue-600 transition-colors">Features</Link>
            <Link to="/#testimonials" className="text-gray-700 hover:text-blue-600 transition-colors">Testimonials</Link>
            <Link to="/#about" className="text-gray-700 hover:text-blue-600 transition-colors">About Us</Link>
            <Link to="/pricing" className="text-blue-600 font-medium">Pricing</Link>
            <Link to="/login">
              <Button className="bg-blue-600 text-white hover:bg-blue-700">
                Login
              </Button>
            </Link>
          </div>
          <div className="md:hidden">
            <Button variant="outline" className="border-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </Button>
          </div>
        </div>
      </nav>

      {/* Header */}
      <section className="container mx-auto px-6 py-12 text-center">
        <h1 className="text-4xl md:text-5xl font-bold text-gray-800 mb-4">Simple, Transparent Pricing</h1>
        <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
          Choose the plan that fits your learning needs. All plans include access to our platform's core features.
        </p>

        {/* Billing Toggle */}
        <div className="flex items-center justify-center mb-12">
          <span className={`text-lg ${billingPeriod === 'monthly' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Monthly</span>
          <div 
            className="w-16 h-8 mx-4 rounded-full bg-blue-100 flex items-center p-1 cursor-pointer"
            onClick={() => setBillingPeriod(billingPeriod === 'monthly' ? 'yearly' : 'monthly')}
          >
            <div 
              className={`w-6 h-6 rounded-full bg-blue-600 shadow-md transform transition-transform ${billingPeriod === 'yearly' ? 'translate-x-8' : ''}`}
            >
            </div>
          </div>
          <span className={`text-lg ${billingPeriod === 'yearly' ? 'text-blue-600 font-medium' : 'text-gray-600'}`}>Yearly</span>
          <span className="ml-2 bg-green-100 text-green-800 text-xs font-semibold px-2 py-1 rounded-full">Save 16%</span>
        </div>

        {/* Pricing Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-6xl mx-auto">
          {pricingTiers.map((tier, index) => (
            <div 
              key={index} 
              className={`
                rounded-xl p-8 
                ${tier.highlighted 
                  ? 'bg-white border-2 border-blue-600 shadow-xl transform md:-translate-y-4' 
                  : 'bg-white border border-gray-200 shadow-sm'
                }
              `}
            >
              {tier.highlighted && (
                <div className="bg-blue-600 text-white text-sm font-bold uppercase tracking-wide py-1 px-4 rounded-full inline-block -mt-12 mb-4">
                  Most Popular
                </div>
              )}
              <h3 className="text-2xl font-bold text-gray-800 mb-2">{tier.name}</h3>
              <p className="text-gray-600 mb-6">{tier.description}</p>
              <div className="mb-6">
                <span className="text-4xl font-bold text-gray-800">
                  ${billingPeriod === 'monthly' ? tier.monthlyPrice : tier.yearlyPrice}
                </span>
                <span className="text-gray-600">/{billingPeriod === 'monthly' ? 'month' : 'year'}</span>
              </div>
              
              <ul className="space-y-3 mb-8">
                {tier.features.map((feature, featureIndex) => (
                  <li key={featureIndex} className="flex items-center">
                    <svg className="w-5 h-5 text-green-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"></path>
                    </svg>
                    <span className="text-gray-600">{feature}</span>
                  </li>
                ))}
              </ul>
              
              <Button 
                variant={tier.buttonVariant} 
                className={`w-full py-2 ${tier.highlighted ? 'bg-blue-600 hover:bg-blue-700 text-white' : 'border-blue-600 text-blue-600 hover:bg-blue-50'}`}
              >
                {tier.buttonText}
              </Button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQ Section */}
      <section className="container mx-auto px-6 py-16">
        <h2 className="text-3xl font-bold text-center text-gray-800 mb-12">Frequently Asked Questions</h2>
        
        <div className="max-w-3xl mx-auto space-y-8">
          {/* FAQ Item 1 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Can I change my plan later?</h3>
            <p className="text-gray-600">
              Yes, you can upgrade or downgrade your plan at any time. If you upgrade, the new pricing will take effect immediately. If you downgrade, the change will take effect at the end of your current billing cycle.
            </p>
          </div>
          
          {/* FAQ Item 2 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Is there a free trial available?</h3>
            <p className="text-gray-600">
              Yes, we offer a 14-day free trial on our Basic and Pro plans. No credit card is required to start your trial. You'll only be charged when you decide to continue after the trial period.
            </p>
          </div>
          
          {/* FAQ Item 3 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">What payment methods do you accept?</h3>
            <p className="text-gray-600">
              We accept all major credit cards (Visa, Mastercard, American Express) and PayPal. For Enterprise plans, we also offer invoice payment options.
            </p>
          </div>
          
          {/* FAQ Item 4 */}
          <div className="border-b border-gray-200 pb-6">
            <h3 className="text-xl font-bold text-gray-800 mb-3">Can I cancel my subscription anytime?</h3>
            <p className="text-gray-600">
              Yes, you can cancel your subscription at any time. Your access will remain active until the end of your current billing period. We don't offer refunds for partial subscription periods.
            </p>
          </div>
          
          {/* FAQ Item 5 */}
          <div>
            <h3 className="text-xl font-bold text-gray-800 mb-3">Do you offer discounts for educational institutions?</h3>
            <p className="text-gray-600">
              Yes, we offer special pricing for educational institutions, nonprofits, and student groups. Please contact our sales team for more information on educational pricing.
            </p>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-blue-600 py-16">
        <div className="container mx-auto px-6 text-center">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-6">
            Ready to Start Your Learning Journey?
          </h2>
          <p className="text-blue-100 mb-8 text-lg max-w-2xl mx-auto">
            Join thousands of learners who are already benefiting from our interactive and personalized learning platform.
          </p>
          <div className="flex flex-col sm:flex-row justify-center space-y-4 sm:space-y-0 sm:space-x-4">
            <Link to="/signup">
              <Button className="bg-white text-blue-600 hover:bg-blue-50 px-8 py-3 text-lg">
                Get Started
              </Button>
            </Link>
            <Link to="/contact">
              <Button variant="outline" className="border-white text-white hover:bg-blue-700 px-8 py-3 text-lg">
                Contact Sales
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-800 text-white py-12">
        <div className="container mx-auto px-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <h3 className="text-xl font-bold mb-4">Ai Study Tools</h3>
              <p className="text-gray-400">
                Transforming the way people learn with interactive and personalized content.
              </p>
            </div>
            <div>
              <h4 className="font-bold mb-4">Product</h4>
              <ul className="space-y-2">
                <li><Link to="/#features" className="text-gray-400 hover:text-white transition-colors">Features</Link></li>
                <li><Link to="/pricing" className="text-gray-400 hover:text-white transition-colors">Pricing</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Integrations</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Case Studies</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Resources</h4>
              <ul className="space-y-2">
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Documentation</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Blog</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Tutorials</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Support</Link></li>
              </ul>
            </div>
            <div>
              <h4 className="font-bold mb-4">Company</h4>
              <ul className="space-y-2">
                <li><Link to="/#about" className="text-gray-400 hover:text-white transition-colors">About Us</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Careers</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Contact</Link></li>
                <li><Link to="#" className="text-gray-400 hover:text-white transition-colors">Privacy Policy</Link></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-gray-400 mb-4 md:mb-0">
              &copy; {new Date().getFullYear()} Ai Study Tools. All rights reserved.
            </p>
            <div className="flex space-x-6">
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M22 12c0-5.523-4.477-10-10-10S2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.878v-6.987h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.988C18.343 21.128 22 16.991 22 12z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clipRule="evenodd" />
                </svg>
              </a>
              <a href="#" className="text-gray-400 hover:text-white transition-colors">
                <svg className="h-6 w-6" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path fillRule="evenodd" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10c5.51 0 10-4.48 10-10S17.51 2 12 2zm6.605 4.61a8.502 8.502 0 011.93 5.314c-.281-.054-3.101-.629-5.943-.271-.065-.141-.12-.293-.184-.445a25.416 25.416 0 00-.564-1.236c3.145-1.28 4.577-3.124 4.761-3.362zM12 3.475c2.17 0 4.154.813 5.662 2.148-.152.216-1.443 1.941-4.48 3.08-1.399-2.57-2.95-4.675-3.189-5A8.687 8.687 0 0112 3.475zm-3.633.803a53.896 53.896 0 013.167 4.935c-3.992 1.063-7.517 1.04-7.896 1.04a8.581 8.581 0 014.729-5.975zM3.453 12.01v-.26c.37.01 4.512.065 8.775-1.215.25.477.477.965.694 1.453-.109.033-.228.065-.336.098-4.404 1.42-6.747 5.303-6.942 5.629a8.522 8.522 0 01-2.19-5.705zM12 20.547a8.482 8.482 0 01-5.239-1.8c.152-.315 1.888-3.656 6.703-5.337.022-.01.033-.01.054-.022a35.318 35.318 0 011.823 6.475 8.4 8.4 0 01-3.341.684zm4.761-1.465c-.086-.52-.542-3.015-1.659-6.084 2.679-.423 5.022.271 5.314.369a8.468 8.468 0 01-3.655 5.715z" clipRule="evenodd" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default PricingPage; 