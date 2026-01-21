'use client'

import { motion } from 'framer-motion'
import { MapPin, User, Mail, Home, Building2 } from 'lucide-react'

interface CheckoutStep1Props {
  formData: {
    name: string
    email: string
    address: string
    apartment: string
    city: string
    province: string
    zip: string
    country: string
    phone: string
    zone: string
  }
  setFormData: (data: any) => void
  onNext: () => void
  errors: Record<string, string>
}

export default function CheckoutStep1({
  formData,
  setFormData,
  onNext,
  errors,
}: CheckoutStep1Props) {
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    // Validation is handled by parent component
    onNext()
  }

  const handleChange = (field: string, value: string) => {
    setFormData({ ...formData, [field]: value })
  }

  return (
    <motion.div
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.3 }}
    >
      <div className="mb-8">
        <h2 className="text-2xl md:text-3xl font-light text-white mb-3 tracking-[0.1em] uppercase">
          Shipping Address
        </h2>
        <p className="text-gray-400 text-sm uppercase tracking-widest font-light">
          Where should we deliver your order?
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Full Name */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
            Full Name
          </label>
          <input
            type="text"
            autoComplete="name"
            name="name"
            value={formData.name}
            onChange={(e) => handleChange('name', e.target.value)}
            className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
              errors.name ? 'border-red-500/50' : 'border-gray-800'
            }`}
            placeholder="John Doe"
            required
          />
          {errors.name && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
            >
              {errors.name}
            </motion.p>
          )}
        </div>

        {/* Email */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
            Email Address
          </label>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            name="email"
            value={formData.email}
            onChange={(e) => handleChange('email', e.target.value)}
            className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
              errors.email ? 'border-red-500/50' : 'border-gray-800'
            }`}
            placeholder="john@example.com"
            required
          />
          {errors.email && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
            >
              {errors.email}
            </motion.p>
          )}
        </div>

        {/* Address */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
            Street Address
          </label>
          <input
            type="text"
            autoComplete="street-address"
            name="address"
            value={formData.address}
            onChange={(e) => handleChange('address', e.target.value)}
            className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
              errors.address ? 'border-red-500/50' : 'border-gray-800'
            }`}
            placeholder="123 Main Street"
            required
          />
          {errors.address && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
            >
              {errors.address}
            </motion.p>
          )}
        </div>

        {/* Apartment/Housing Number */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
            Apartment / Housing Number <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            autoComplete="address-line2"
            name="apartment"
            value={formData.apartment}
            onChange={(e) => handleChange('apartment', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-800 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation"
            placeholder="Apt 4B, Unit 12, etc."
          />
        </div>

        {/* City & ZIP */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
              City
            </label>
            <input
              type="text"
              autoComplete="address-level2"
              name="city"
              value={formData.city}
              onChange={(e) => handleChange('city', e.target.value)}
              className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
                errors.city ? 'border-red-500/50' : 'border-gray-800'
              }`}
              placeholder="Amsterdam"
              required
            />
            {errors.city && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
              >
                {errors.city}
              </motion.p>
            )}
          </div>
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
              ZIP Code
            </label>
            <input
              type="text"
              inputMode="text"
              autoComplete="postal-code"
              name="zip"
              value={formData.zip}
              onChange={(e) => handleChange('zip', e.target.value)}
              className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
                errors.zip ? 'border-red-500/50' : 'border-gray-800'
              }`}
              placeholder="1012 AB"
              required
            />
            {errors.zip && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
              >
                {errors.zip}
              </motion.p>
            )}
          </div>
        </div>

        {/* Province/Region */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
            Province / Region <span className="text-gray-500">(Optional)</span>
          </label>
          <input
            type="text"
            autoComplete="address-level1"
            name="province"
            value={formData.province}
            onChange={(e) => handleChange('province', e.target.value)}
            className="w-full px-4 py-3 bg-black border-2 border-gray-800 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation"
            placeholder="North Holland, California, etc."
          />
        </div>

        {/* Shipping Zone + Country name */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
              Shipping Zone
            </label>
            <select
              name="zone"
              value={formData.zone}
              onChange={(e) => handleChange('zone', e.target.value)}
              className={`w-full px-4 py-3 bg-black border-2 text-white focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
                errors.country ? 'border-red-500/50' : 'border-gray-800'
              }`}
              required
            >
              <option value="" className="bg-black">Select Zone</option>
              <option value="EU" className="bg-black">EU</option>
              <option value="US" className="bg-black">US</option>
              <option value="CA" className="bg-black">Canada</option>
              <option value="AU" className="bg-black">Australia</option>
              <option value="ASIA" className="bg-black">Asia</option>
            </select>
            {errors.country && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
              >
                {errors.country}
              </motion.p>
            )}
          </div>

          <div>
            <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
              Country (for shipping label)
            </label>
            <input
              type="text"
              autoComplete="country-name"
              name="country"
              value={formData.country}
              onChange={(e) => handleChange('country', e.target.value)}
              className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
                errors.country ? 'border-red-500/50' : 'border-gray-800'
              }`}
              placeholder="Netherlands"
              required
            />
            {errors.country && (
              <motion.p 
                initial={{ opacity: 0, y: -5 }}
                animate={{ opacity: 1, y: 0 }}
                className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
              >
                {errors.country}
              </motion.p>
            )}
          </div>
        </div>

        {/* Phone Number */}
        <div>
          <label className="block text-xs uppercase tracking-widest mb-2 text-gray-400 font-light">
            Phone Number
          </label>
          <input
            type="text"
            inputMode="tel"
            autoComplete="tel"
            name="phone"
            value={formData.phone}
            onChange={(e) => handleChange('phone', e.target.value)}
            pattern="[\+]?[0-9\s\-\(\)]+"
            className={`w-full px-4 py-3 bg-black border-2 text-white placeholder:text-gray-500 focus:border-white focus:outline-none transition-all duration-300 font-light text-sm touch-manipulation ${
              errors.phone ? 'border-red-500/50' : 'border-gray-800'
            }`}
            placeholder="+31 6 12345678"
            required
          />
          {errors.phone && (
            <motion.p 
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              className="mt-2 text-xs text-red-400 uppercase tracking-wider font-light"
            >
              {errors.phone}
            </motion.p>
          )}
        </div>

        {/* Next Button */}
        <motion.button
          type="submit"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          transition={{ type: "spring", stiffness: 400, damping: 17 }}
          className="w-full py-4 md:py-5 bg-white text-black font-light tracking-[0.1em] uppercase text-sm md:text-base flex items-center justify-center gap-3 touch-manipulation min-h-[56px] hover:bg-gray-100 hover:border-gray-200 transition-all duration-300 border-2 border-white mt-8"
        >
          Continue to Payment
          <span className="text-lg">→</span>
        </motion.button>
      </form>
    </motion.div>
  )
}

