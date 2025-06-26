import React, { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux'; 
import { useNavigate } from 'react-router-dom'; // Import useNavigate from react-router-dom     
export default function Checkout() {
  const cartItems = useSelector((state) => state.cart.items);
  const totalAmount = useSelector((state) => state.cart.totalAmount);
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleCheckout = () => {
    // Here you can implement the logic for handling the checkout process
    // For example, you might want to send the cart items to a server or clear the cart
    console.log('Checkout initiated with items:', cartItems);
    // Clear the cart after checkout
    dispatch({ type: 'cart/clearCart' });
    navigate('/'); // Redirect to home page after checkout
  };

  return (
    <div className="checkout">
      <h2>Checkout</h2>
      <ul>
        {cartItems.map((item, index) => (
          <li key={index}>{item.name} - ${item.price}</li>
        ))}
      </ul>
      <h3>Total Amount: ${totalAmount}</h3>
      <button onClick={handleCheckout}>Complete Checkout</button>
    </div>
  );
}                                    