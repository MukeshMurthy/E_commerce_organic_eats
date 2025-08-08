// context/cartContext.js
import { createContext, useContext, useState } from 'react';
import axios from 'axios';

const CartContext = createContext();

export function CartProvider({ children }) {
  const [cartItems, setCartItems] = useState([]);

  const addToCart = async (userId, product) => {
    try {
      await axios.post('http://localhost:5001/api/cart', {
        user_id: userId,
        product_id: product.id,
        quantity: 1
      });

      const updatedItems = [...cartItems];
      const existing = updatedItems.find(item => item.id === product.id);

      if (existing) {
        existing.quantity += 1;
      } else {
        updatedItems.push({ ...product, quantity: 1 });
      }

      setCartItems(updatedItems);
    } catch (err) {
      console.error('Cart context addToCart failed:', err);
    }
  };

  const getTotalQuantity = () =>
    cartItems.reduce((total, item) => total + item.quantity, 0);

  const getTotalAmount = () =>
    cartItems.reduce((total, item) => total + item.price * item.quantity, 0);

  return (
    <CartContext.Provider
      value={{
        cartItems,
        addToCart,
        getTotalAmount,
        getTotalQuantity
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => useContext(CartContext);
