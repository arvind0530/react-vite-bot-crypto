import React, { useEffect, useState } from 'react';
import { fetchProducts } from '../utils/delta';
// import { fetchProducts } from '../utils/delta';

export default function Products() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const useTest = localStorage.getItem('delta_useTest') === 'true';

  useEffect(() => {
    (async () => {
      setLoading(true);
      try {
        const prods = await fetchProducts(useTest);
        setProducts(prods);
      } catch (err) {
        console.error(err);
        alert('Products fetch failed: ' + err.message);
      } finally {
        setLoading(false);
      }
    })();
  }, [useTest]);

  return (
    <div>
      <h2>Products ({useTest ? 'testnet' : 'prod'})</h2>
      {loading && <div>Loading...</div>}
      <div style={{ maxHeight: 520, overflow: 'auto' }}>
        <table width="100%" style={{ borderCollapse: 'collapse' }}>
          <thead>
            <tr style={{ textAlign: 'left', borderBottom: '1px solid #ddd' }}>
              <th>Symbol</th><th>Product ID</th><th>Type</th><th>Description</th>
            </tr>
          </thead>
          <tbody>
            {products.map(p => (
              <tr key={p.id} style={{ borderBottom: '1px solid #f3f3f3' }}>
                <td>{p.symbol}</td>
                <td>{p.id}</td>
                <td>{p.product_type}</td>
                <td>{p.description}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
