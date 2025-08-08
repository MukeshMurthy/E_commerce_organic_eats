import React, { useState, useRef } from 'react';
import './Addproduct.css';
import axios from 'axios';
import { FiUploadCloud, FiX } from 'react-icons/fi';
import CustomToast from '../../components/toast/CustomToast';

function AddProduct({ onProductAdded }) {
  const [product, setProduct] = useState({
    name: '',
    price: '',
    category: '',
    subCategory: '',
    description: '',
    tags: [],
    stock: 0,
    calories: '',
    image_url: ''
  });

  const [tagInput, setTagInput] = useState('');
  const [selectedFile, setSelectedFile] = useState(null);
  const [uploading, setUploading] = useState(false);
  
  // Create a ref for the toast component
  const toastRef = useRef();

  // Test function to verify toast is working
  const testToast = () => {
    console.log('Testing toast...', toastRef.current);
    console.log('Available methods:', Object.keys(toastRef.current || {}));
    
    if (toastRef.current) {
      console.log('Showing success toast...');
      toastRef.current.showSuccess('Toast is working!');
    } else {
      console.error('Toast ref is null');
    }
  };

  const testConfirmToast = () => {
    console.log('Testing confirm dialog...', toastRef.current);
    
    if (toastRef.current) {
      console.log('Showing confirm dialog...');
      toastRef.current.showConfirm({
        message: 'This is a test confirmation dialog',
        onConfirm: () => {
          console.log('User clicked confirm');
        },
        onCancel: () => {
          console.log('User clicked cancel');
        },
        confirmText: 'Test Confirm',
        cancelText: 'Test Cancel'
      });
    } else {
      console.error('Toast ref is null for confirm');
    }
  };

  const handleAddTag = (e) => {
    if (e.key === 'Enter' && tagInput.trim()) {
      setProduct(prev => ({
        ...prev,
        tags: [...prev.tags, tagInput.trim()]
      }));
      setTagInput('');
    }
  };

  const removeTag = (i) => {
    const newTags = [...product.tags];
    newTags.splice(i, 1);
    setProduct(prev => ({ ...prev, tags: newTags }));
  };

  const handleImageUpload = async () => {
    if (!selectedFile) {
      console.log('Showing error toast for no file');
      toastRef.current?.showError('Please select an image before uploading.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedFile);

    try {
      setUploading(true);
      const res = await axios.post('http://localhost:5001/api/upload', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setProduct(prev => ({ ...prev, image_url: res.data.imageUrl }));
      console.log('Showing success toast for upload');
      toastRef.current?.showSuccess('Image uploaded successfully!');
    } catch (err) {
      console.error('Image upload failed:', err);
      console.log('Showing error toast for upload failure');
      toastRef.current?.showError('Image upload failed. Please try again.');
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async () => {
    console.log('=== HANDLE SUBMIT CALLED ===');
    console.log('Toast ref:', toastRef.current);
    
    // Validation
    if (!product.name.trim()) {
      console.log('Validation failed: no name');
      toastRef.current?.showError('Please enter a product name.');
      return;
    }
    
    if (!product.price || product.price <= 0) {
      console.log('Validation failed: invalid price');
      toastRef.current?.showError('Please enter a valid price.');
      return;
    }
    
    if (!product.category.trim()) {
      console.log('Validation failed: no category');
      toastRef.current?.showError('Please enter a category.');
      return;
    }
    
    if (!product.image_url) {
      console.log('Validation failed: no image');
      toastRef.current?.showError('Please upload an image before submitting.');
      return;
    }

    console.log('All validations passed, showing confirmation dialog...');

    // Show confirmation dialog before submitting
    if (toastRef.current && toastRef.current.showConfirm) {
      console.log('Calling showConfirm...');
      toastRef.current.showConfirm({
        message: 'Are you sure you want to add this product?',
        onConfirm: async () => {
          console.log('User confirmed, submitting product...');
          try {
            await axios.post('http://localhost:5001/api/admin/products', product);
            onProductAdded();
            toastRef.current?.showSuccess('Product added successfully!');

            // Reset form
            setProduct({
              name: '',
              price: '',
              category: '',
              subCategory: '',
              description: '',
              tags: [],
              stock: 0,
              calories: '',
              image_url: ''
            });
            setSelectedFile(null);
          } catch (err) {
            console.error('Error adding product:', err);
            toastRef.current?.showError('Failed to add product. Please try again.');
          }
        },
        onCancel: () => {
          console.log('User cancelled submission');
          toastRef.current?.showInfo('Product submission cancelled.');
        },
        confirmText: 'Add Product',
        cancelText: 'Cancel'
      });
    } else {
      console.error('showConfirm method not available!');
      console.log('Available methods:', toastRef.current ? Object.keys(toastRef.current) : 'ref is null');
      
      // Fallback to regular submission without confirmation
      console.log('Using fallback submission...');
      try {
        await axios.post('http://localhost:5001/api/admin/products', product);
        onProductAdded();
        alert('Product added successfully!'); // Temporary fallback
      } catch (err) {
        console.error('Error adding product:', err);
        alert('Failed to add product.'); // Temporary fallback
      }
    }
  };

  return (
    <div className="add-product-container">
      {/* Toast component - add this at the top */}
      <CustomToast ref={toastRef} />
      
      <div className="image-upload-box">
        <div className="upload-area">
          <FiUploadCloud size={40} />
          <p>Choose image to upload</p>
        </div>

        <label htmlFor="file-upload" className="upload-label">
          {selectedFile ? selectedFile.name : 'Choose Image'}
        </label>
        <input
          id="file-upload"
          type="file"
          accept="image/*"
          onChange={(e) => setSelectedFile(e.target.files[0])}
        />

        <button className="upload-button" onClick={handleImageUpload} disabled={uploading}>
          {uploading ? 'Uploading...' : 'Upload Image'}
        </button>
      </div>

      <div className="form-area">
        <input
          placeholder="Product Name"
          value={product.name}
          onChange={e => setProduct({ ...product, name: e.target.value })}
        />
        <input
          placeholder="Price"
          type="number"
          value={product.price}
          onChange={e => setProduct({ ...product, price: e.target.value })}
        />
        <input
          placeholder="Category"
          value={product.category}
          onChange={e => setProduct({ ...product, category: e.target.value })}
        />
        <input
          placeholder="Sub Category"
          value={product.subCategory}
          onChange={e => setProduct({ ...product, subCategory: e.target.value })}
        />
        <textarea
          placeholder="Description"
          value={product.description}
          onChange={e => setProduct({ ...product, description: e.target.value })}
        />
        <input
          placeholder="Stock"
          type="number"
          value={product.stock}
          onChange={e => setProduct({ ...product, stock: parseInt(e.target.value) || 0 })}
        />
        <input
          placeholder="Calories"
          type="number"
          value={product.calories}
          onChange={e => setProduct({ ...product, calories: parseInt(e.target.value) || '' })}
        />

        <div className="tag-input-container">
          <input
            placeholder="Add Tags (Press Enter)"
            value={tagInput}
            onChange={(e) => setTagInput(e.target.value)}
            onKeyDown={handleAddTag}
          />
          <div className="tags-display">
            {product.tags.map((tag, i) => (
              <span className="tag" key={i}>
                {tag} <FiX onClick={() => removeTag(i)} />
              </span>
            ))}
          </div>
        </div>

        <button className="publish-btn" onClick={handleSubmit}>Publish Product</button>
        
        
      </div>
    </div>
  );
}

export default AddProduct;