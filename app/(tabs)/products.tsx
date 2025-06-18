// import { useEffect, useState } from 'react'
// import { View, Text, FlatList, StyleSheet } from 'react-native'
// import { ProductService } from '../../services/SupabaseService'
// import { Tables } from '../../app/types/supabase'

// export default function ProductsScreen() {
//   const [products, setProducts] = useState<Tables<'products'>[]>([])
//   const [loading, setLoading] = useState(true)

//   useEffect(() => {
//     const fetchProducts = async () => {
//       try {
//         const data = await ProductService.getProducts()
//         setProducts(data)
//       } catch (error) {
//         console.error('Error fetching products:', error)
//       } finally {
//         setLoading(false)
//       }
//     }

//     fetchProducts()
//   }, [])

//   if (loading) {
//     return (
//       <View style={styles.container}>
//         <Text>Loading products...</Text>
//       </View>
//     )
//   }

//   return (
//     <View style={styles.container}>
//       <FlatList
//         data={products}
//         keyExtractor={(item) => item.id}
//         renderItem={({ item }) => (
//           <View style={styles.productItem}>
//             <Text style={styles.productName}>{item.name}</Text>
//             <Text style={styles.productPrice}>${item.price.toFixed(2)}</Text>
//             {item.description && (
//               <Text style={styles.productDescription}>{item.description}</Text>
//             )}
//           </View>
//         )}
//       />
//     </View>
//   )
// }

// const styles = StyleSheet.create({
//   container: {
//     flex: 1,
//     padding: 16,
//   },
//   productItem: {
//     padding: 16,
//     marginBottom: 12,
//     backgroundColor: '#fff',
//     borderRadius: 8,
//     shadowColor: '#000',
//     shadowOffset: { width: 0, height: 2 },
//     shadowOpacity: 0.1,
//     shadowRadius: 4,
//     elevation: 2,
//   },
//   productName: {
//     fontSize: 18,
//     fontWeight: 'bold',
//     marginBottom: 4,
//   },
//   productPrice: {
//     fontSize: 16,
//     color: '#007AFF',
//     marginBottom: 4,
//   },
//   productDescription: {
//     fontSize: 14,
//     color: '#666',
//   },
// })
