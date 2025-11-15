'use client'

import { motion } from 'framer-motion'
import { Leaf, DollarSign, Clock, Award, TrendingDown } from 'lucide-react'

interface Vendor {
  id: string
  name: string
  price: number
  carbon: number
  delivery: number
  sustainability_score: number
  willing_to_discount: boolean
  description?: string
}

interface VendorCardProps {
  vendor: Vendor
}

export default function VendorCard({ vendor }: VendorCardProps) {
  const getSustainabilityColor = (score: number) => {
    if (score >= 8) return 'text-green-400'
    if (score >= 6) return 'text-yellow-400'
    return 'text-red-400'
  }

  const getCarbonColor = (carbon: number) => {
    if (carbon <= 20) return 'text-green-400'
    if (carbon <= 40) return 'text-yellow-400'
    return 'text-red-400'
  }

  return (
    <motion.div
      whileHover={{ y: -4, scale: 1.02 }}
      className="glass rounded-xl p-6 border border-primary-500/20 hover:border-primary-500/40 transition cursor-pointer"
    >
      <div className="flex items-start justify-between mb-4">
        <h4 className="text-xl font-bold text-white">{vendor.name}</h4>
        {vendor.willing_to_discount && (
          <span className="bg-primary-500/20 text-primary-400 text-xs px-2 py-1 rounded-full flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            Discount Available
          </span>
        )}
      </div>

      {vendor.description && (
        <p className="text-gray-400 text-sm mb-4">{vendor.description}</p>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <DollarSign className="w-4 h-4" />
            <span className="text-sm">Price</span>
          </div>
          <span className="text-white font-semibold">${vendor.price.toFixed(2)}</span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Leaf className="w-4 h-4" />
            <span className="text-sm">Carbon (kg CO₂)</span>
          </div>
          <span className={`font-semibold ${getCarbonColor(vendor.carbon)}`}>
            {vendor.carbon} kg
          </span>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-gray-400">
            <Clock className="w-4 h-4" />
            <span className="text-sm">Delivery (days)</span>
          </div>
          <span className="text-white font-semibold">{vendor.delivery} days</span>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-gray-700">
          <div className="flex items-center gap-2 text-gray-400">
            <Award className="w-4 h-4" />
            <span className="text-sm">Sustainability</span>
          </div>
          <span className={`font-bold text-lg ${getSustainabilityColor(vendor.sustainability_score)}`}>
            {vendor.sustainability_score}/10
          </span>
        </div>
      </div>
    </motion.div>
  )
}

