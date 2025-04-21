import { createClient } from '@supabase/supabase-js'
import { Database } from '../app/types/supabase'

const supabaseUrl = 'https://bnlyyaprilekdcyfzybx.supabase.co'
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJubHl5YXByaWxla2RjeWZ6eWJ4Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDUyMDM0NzUsImV4cCI6MjA2MDc3OTQ3NX0.EcRI0raZbGU3DtAoAzv3fZGwCu05jLADKEbMCHyCeRE'

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey)

export const ProductService = {
  async getProducts() {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    
    if (error) throw error
    return data
  },

  async addProduct(product: {
    name: string
    description?: string
    price: number
    image_url?: string
  }) {
    const { data, error } = await supabase
      .from('products')
      .insert(product)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async updateProduct(
    id: string,
    updates: {
      name?: string
      description?: string
      price?: number
      image_url?: string
    }
  ) {
    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', id)
      .select()
    
    if (error) throw error
    return data[0]
  },

  async deleteProduct(id: string) {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id)
    
    if (error) throw error
  }
}
