import React, { useState } from 'react';
import './Pricing.css'; // Import the CSS file
import { Check, Star, Zap, Shield, Download, Globe, Smartphone } from 'lucide-react';

const PricingPage = () => {
  const [hoveredCard, setHoveredCard] = useState(null);

  const plans = [
    {
      id: 'free',
      name: 'Free Plan',
      description: 'Perfect for occasional users',
      originalPrice: null,
      currentPrice: '$0',
      period: 'Forever free',
      discount: null,
      features: [
        '5 conversions/merges per day',
        '200+ file format support',
        'Advanced compression',
        'Password encryption',
        'Online processing',
        'Basic customer support'
      ],
      buttonText: 'Get Started Free',
      buttonStyle: 'outline',
      popular: false
    },
    {
      id: 'monthly',
      name: 'Monthly Plan',
      description: 'Best value for regular users',
      originalPrice: '$6.99',
      currentPrice: '$3.99',
      period: 'per month',
      discount: 'Save 43%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Desktop app download',
        'Offline local processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Priority customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Start Monthly Plan',
      buttonStyle: 'primary',
      popular: true
    },
    {
      id: 'yearly',
      name: 'Yearly Plan',
      description: 'Maximum savings for power users',
      originalPrice: '$49.99',
      currentPrice: '$24.99',
      period: 'per year',
      discount: 'Save 50%',
      features: [
        'Unlimited conversions & merges',
        '200+ file formats supported',
        'Desktop app download',
        'Offline local processing',
        'Advanced compression & encryption',
        'Batch processing',
        'Premium customer support',
        'No advertisements',
        'Free Upgrades'
      ],
      buttonText: 'Get Yearly Plan',
      buttonStyle: 'secondary',
      popular: false
    }
  ];

  return (
    <div className="pricing-container">
      <div className="pricing-wrapper">
        {/* Header Section */}
        <div className="pricing-header">
          <div className="pricing-icon">
            <div className="pricing-icon-bg">
              <Zap size={32} color="white" />
            </div>
          </div>
          <h1 className="pricing-title">Choose Your Plan</h1>
          <p className="pricing-subtitle">
            Transform your files with professional-grade tools. Convert, merge, and compress with complete security and privacy.
          </p>
        </div>

        {/* Pricing Grid */}
        <div className="pricing-grid">
          {plans.map((plan) => (
            <div
              key={plan.id}
              className={`pricing-card ${plan.popular ? 'popular' : ''} ${
                hoveredCard === plan.id ? 'hovered' : ''
              }`}
              onMouseEnter={() => setHoveredCard(plan.id)}
              onMouseLeave={() => setHoveredCard(null)}
            >
              {/* Popular Badge */}
              {plan.popular && (
                <div className="popular-badge">
                  <Star size={16} fill="currentColor" />
                  MOST POPULAR
                </div>
              )}

              {/* Plan Header */}
              <div className="plan-header">
                <h3 className="plan-name">{plan.name}</h3>
                <p className="plan-description">{plan.description}</p>
                
                {/* Pricing */}
                <div className="price-section">
                  {plan.originalPrice && (
                    <div className="original-price">
                      {plan.originalPrice}/month
                    </div>
                  )}
                  <div className="current-price-wrapper">
                    <span className="current-price">{plan.currentPrice}</span>
                    <span className="price-period">{plan.period}</span>
                  </div>
                  {plan.discount && (
                    <div className="discount-badge">
                      {plan.discount}
                    </div>
                  )}
                </div>
              </div>

              {/* Features List */}
              <ul className="features-list">
                {plan.features.map((feature, index) => (
                  <li key={index} className="feature-item">
                    <div className="feature-icon">
                      <Check size={16} color="#16a34a" />
                    </div>
                    <span className="feature-text">{feature}</span>
                  </li>
                ))}
              </ul>

              {/* CTA Button */}
              <button className={`cta-button ${plan.buttonStyle}`}
              onClick={() => {
                if (plan.id === 'free') {
                // Open FileConvertApp via global custom event
                const event = new Event('open-free-plan');
                window.dispatchEvent(event);
                } else if (plan.id === 'monthly') {
                window.location.href = 'https://buy.stripe.com/test_monthly_link'; // Replace with your actual Stripe link
                } else if (plan.id === 'yearly') {
                window.location.href = 'https://buy.stripe.com/test_yearly_link'; // Replace with your actual Stripe link
                }
            }}>
                {plan.buttonText}
              </button>

            </div>
          ))}
        </div>

        {/* Feature Highlights */}
        <div className="features-highlight">
          <h2 className="features-highlight-title">
            Why Choose ConvertMaster?
          </h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-card-icon blue">
                <Shield size={24} color="white" />
              </div>
              <h3 className="feature-card-title">100% Secure</h3>
              <p className="feature-card-text">All processing happens locally on your device</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon purple">
                <Download size={24} color="white" />
              </div>
              <h3 className="feature-card-title">Offline Ready</h3>
              <p className="feature-card-text">Works without internet connection</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon green">
                <Globe size={24} color="white" />
              </div>
              <h3 className="feature-card-title">200+ Formats</h3>
              <p className="feature-card-text">Support for all major file types</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-card-icon orange">
                <Smartphone size={24} color="white" />
              </div>
              <h3 className="feature-card-title">Cross-Platform</h3>
              <p className="feature-card-text">Available on Windows, Mac, and Web</p>
            </div>
          </div>
        </div>

        {/* Trust Section */}
        <div className="trust-section">
          <div className="trust-card">
            <div className="rating-section">
              <div className="stars">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="star" />
                ))}
              </div>
              <span className="rating-text">4.9/5 from 10,000+ users</span>
            </div>
            <p className="testimonial-text">
              "ConvertMaster has completely transformed how I handle file conversions. The offline capability gives me peace of mind for sensitive documents."
            </p>
            <p className="testimonial-author">- Sarah Chen, Digital Marketing Manager</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingPage;