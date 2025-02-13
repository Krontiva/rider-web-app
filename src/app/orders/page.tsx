'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';

interface Order {
  id: string;
  customerName: string;
  orderNumber: string;
  orderStatus: string;
  pickup: Array<{
    fromAddress: string;
    fromLatitude?: number;
    fromLongitude?: number;
  }>;
  dropOff: Array<{
    toAddress: string;
  }>;
  deliveryPrice: number;
  batchID?: string;
  batchedOrderNumbers?: number[];
  courierName: string;
  orderReceivedTime: string;
  orderPickedupTime: string;
  orderOnmywayTime: string;
  customerPhoneNumber: string;
}

type FilterType = 'Pending' | 'Complete' | 'Cancelled';

const STATUS_COLORS = {
  ReadyForPickup: {
    background: '#DEE9FF',
    text: '#4A6FA5'
  },
  Assigned: {
    background: '#FFFCAD',
    text: '#8B8654'
  },
  'Pickup': {
    background: '#EDEDED',
    text: '#666666'
  },
  OnTheWay: {
    background: '#FFD9AD',
    text: '#A67B4D'
  },
  Delivered: {
    background: '#D2FFAD',
    text: '#5C8C3E'
  },
  Cancelled: {
    background: '#FFBDAD',
    text: '#A65D45'
  },
  DeliveryFailed: {
    background: '#000000',
    text: '#FFFFFF'
  },
  Completed: {
    background: '#D2FFAD',
    text: '#5C8C3E'
  }
} as const;

interface OrderCardProps {
  order: Order & { batchedOrders?: Order[] };
  onRefresh: () => void;
}

const OrderCard = ({ order, onRefresh }: OrderCardProps) => {
  const [isCompleting, setIsCompleting] = useState(false);
  const [isCancelling, setIsCancelling] = useState(false);

  const getStatusColors = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ReadyForPickup;
  };

  const handleViewDetails = () => {
    if (order.batchID && order.batchedOrders) {
      const origin = encodeURIComponent(order.pickup?.[0]?.fromAddress || '');
      const destinations = order.batchedOrders.map(o => 
        encodeURIComponent(o.dropOff?.[0]?.toAddress || '')
      );
      
      const waypoints = destinations.slice(0, -1).map(dest => `via:${dest}`).join('|');
      const finalDestination = destinations[destinations.length - 1];
      
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${finalDestination}${waypoints ? `&waypoints=${waypoints}` : ''}`;
      window.open(url, '_blank');
    } else {
      const origin = encodeURIComponent(order.pickup?.[0]?.fromAddress || '');
      const destination = encodeURIComponent(order.dropOff?.[0]?.toAddress || '');
      const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
      window.open(url, '_blank');
    }
  };

  const handleComplete = async () => {
    try {
      setIsCompleting(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Xano-Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            completed: true,
            orderCompletedTime: new Date().toISOString(),
            orderStatus: 'Delivered',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // If this is a batch order, update all orders with same batchID
      if (order.batchID && order.batchedOrders) {
        await Promise.all(
          order.batchedOrders.map(async (batchOrder) => {
            if (batchOrder.id !== order.id) {
              await fetch(
                `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${batchOrder.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Xano-Authorization': `Bearer ${authToken}`,
                  },
                  body: JSON.stringify({
                    completed: true,
                    orderCompletedTime: new Date().toISOString(),
                    orderStatus: 'Delivered',
                  }),
                }
              );
            }
          })
        );
      }

      // Refresh orders list
      onRefresh();

    } catch (error) {
      console.error('Error updating order:', error);
      alert('Failed to update order status');
    } finally {
      setIsCompleting(false);
    }
  };

  const handleCancel = async () => {
    try {
      setIsCancelling(true);
      const authToken = localStorage.getItem('authToken');
      if (!authToken) return;

      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Xano-Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            completed: false,
            orderStatus: 'Cancelled',
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to cancel order');
      }

      // If this is a batch order, cancel all orders with same batchID
      if (order.batchID && order.batchedOrders) {
        await Promise.all(
          order.batchedOrders.map(async (batchOrder) => {
            if (batchOrder.id !== order.id) {
              await fetch(
                `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${batchOrder.id}`,
                {
                  method: 'PATCH',
                  headers: {
                    'Content-Type': 'application/json',
                    'X-Xano-Authorization': `Bearer ${authToken}`,
                  },
                  body: JSON.stringify({
                    completed: false,
                    orderStatus: 'Cancelled',
                  }),
                }
              );
            }
          })
        );
      }

      onRefresh();
    } catch (error) {
      console.error('Error canceling order:', error);
      alert('Failed to cancel order');
    } finally {
      setIsCancelling(false);
    }
  };

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const actionButtons = (
    <div className="flex items-center gap-2">
      <button 
        className="text-white font-medium flex items-center bg-[#FE5B18] px-4 py-2 rounded-md hover:bg-[#e54d0e] disabled:opacity-50"
        onClick={handleComplete}
        disabled={isCompleting || isCancelling}
      >
        {isCompleting ? (
          <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg 
            className="w-4 h-4 mr-1" 
            fill="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
        )}
        {isCompleting ? 'Completing...' : 'Complete'}
      </button>
      <button 
        className="text-white font-medium flex items-center bg-black px-4 py-2 rounded-md hover:bg-gray-800 disabled:opacity-50"
        onClick={handleCancel}
        disabled={isCompleting || isCancelling}
      >
        {isCancelling ? (
          <svg className="animate-spin h-4 w-4 mr-1" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
          </svg>
        ) : (
          <svg 
            className="w-4 h-4 mr-1" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        )}
        {isCancelling ? 'Cancelling...' : 'Cancel'}
      </button>
    </div>
  );

  if (order.batchID && order.batchedOrders) {
    // Calculate total amount from all orders in the batch
    const totalAmount = order.batchedOrders.reduce((sum, batchOrder) => 
      sum + (Number(batchOrder.deliveryPrice) || 0), 
    0).toFixed(2);  // Add toFixed(2) for proper decimal formatting

    return (
      <div className="bg-[#FFF8E1] p-4 rounded-lg shadow mb-4">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-semibold">Batched</h3>
            <p className="text-gray-600 text-sm">Batch ID #{order.batchID}</p>
          </div>
          <span 
            className="px-3 py-1 rounded-full text-sm"
            style={{
              backgroundColor: getStatusColors(order.orderStatus).background,
              color: getStatusColors(order.orderStatus).text
            }}
          >
            {order.orderStatus}
          </span>
        </div>

        <div className="bg-white rounded-lg p-3 mb-4">
          {order.batchedOrders.map((batchedOrder, index) => (
            <div key={batchedOrder.id} className="flex items-center py-2 border-b border-gray-100">
              <div className="w-6 h-6 rounded-full bg-[#FE5B18] flex items-center justify-center mr-3">
                <span className="text-white text-sm font-bold">{index + 1}</span>
              </div>
              <div className="flex-1">
                <span className="text-gray-600">Order #{batchedOrder.orderNumber}</span>
                <p className="text-sm text-gray-500 truncate">
                  {batchedOrder.dropOff?.[0]?.toAddress || ''}
                </p>
                {batchedOrder.customerPhoneNumber && (
                  <button 
                    onClick={() => handleCall(batchedOrder.customerPhoneNumber)}
                    className="text-[#FE5B18] text-sm flex items-center mt-1"
                  >
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="currentColor" 
                      viewBox="0 0 20 20"
                    >
                      <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                    </svg>
                    {batchedOrder.customerPhoneNumber}
                  </button>
                )}
              </div>
            </div>
          ))}
          <div className="mt-3">
            <p className="font-semibold mb-1">Pickup Point</p>
            <p className="text-gray-600 truncate">
              {order.pickup?.[0]?.fromAddress || ''}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-black">
            {totalAmount} GHS
          </span>
          {order.orderStatus !== 'Delivered' && (
            <div className="flex items-center gap-4">
              <button 
                className="text-[#FE5B18] font-medium flex items-center"
                onClick={handleViewDetails}
              >
                <svg 
                  className="w-4 h-4 mr-1" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/>
                  <circle cx="12" cy="9" r="2.5"/>
                </svg>
                Show Route
              </button>
              {actionButtons}
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-4 rounded-lg shadow mb-4">
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-black">{order.customerName}</h3>
          <div className="flex items-center gap-3">
            <p className="text-gray-500 text-sm">#{String(order.orderNumber).padStart(3, '0')}</p>
            {order.customerPhoneNumber && (
              <button 
                onClick={() => handleCall(order.customerPhoneNumber)}
                className="text-[#FE5B18] text-sm flex items-center"
              >
                <svg 
                  className="w-4 h-4 mr-1" 
                  fill="currentColor" 
                  viewBox="0 0 20 20"
                >
                  <path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z" />
                </svg>
                {order.customerPhoneNumber}
              </button>
            )}
          </div>
        </div>
        <span 
          className="px-3 py-1 rounded-full text-sm"
          style={{
            backgroundColor: getStatusColors(order.orderStatus).background,
            color: getStatusColors(order.orderStatus).text
          }}
        >
          {order.orderStatus}
        </span>
      </div>

      <div className="flex gap-4 mb-4">
        <div className="flex-1">
          <p className="font-semibold mb-1 text-black">Pickup</p>
          <p className="text-gray-600 truncate">
            {order.pickup?.[0]?.fromAddress || ''}
          </p>
        </div>
        <div className="flex-1">
          <p className="font-semibold mb-1 text-black">Dropoff</p>
          <p className="text-gray-600 truncate">
            {order.dropOff?.[0]?.toAddress || ''}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-black">
          {(order.deliveryPrice || 0)} GHS
        </span>
        {order.orderStatus !== 'Delivered' && (
          <div className="flex items-center gap-4">
            <button 
              className="text-[#FE5B18] font-medium flex items-center"
              onClick={handleViewDetails}
            >
              <svg 
                className="w-4 h-4 mr-1" 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zM7 9c0-2.76 2.24-5 5-5s5 2.24 5 5c0 2.88-2.88 7.19-5 9.88C9.92 16.21 7 11.85 7 9z"/>
                <circle cx="12" cy="9" r="2.5"/>
              </svg>
              Show Route
            </button>
            {actionButtons}
          </div>
        )}
      </div>
    </div>
  );
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState<FilterType>('Pending');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const router = useRouter();

  const fetchOrders = useCallback(async () => {
    try {
      // Get auth token from localStorage
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/'); // Redirect to login if no token
        return;
      }

      // First get current user details
      const userResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/me', {
        headers: {
          'X-Xano-Authorization': `Bearer ${authToken}`,
          'X-Xano-Authorization-Only': 'true',
        }
      });

      if (!userResponse.ok) {
        throw new Error('Failed to get user details');
      }

      const userData = await userResponse.json();
      const courierName = userData.fullName; // Assuming the API returns fullName

      // Fetch orders
      const ordersResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table', {
        headers: {
          'X-Xano-Authorization': `Bearer ${authToken}`,
        }
      });

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const allOrders = await ordersResponse.json();
      
      // Filter orders by courierName
      const filteredOrders = allOrders.filter((order: Order) => 
        order.courierName === courierName
      );

      setOrders(filteredOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Calculate counts based on order status
  const getFilterCount = (filter: FilterType) => {
    switch (filter) {
      case 'Pending':
        return orders.filter(order => order.orderStatus === 'Assigned').length;
      case 'Complete':
        return orders.filter(order => order.orderStatus === 'Delivered').length;
      case 'Cancelled':
        return orders.filter(order => order.orderStatus === 'Cancelled').length;
      default:
        return 0;
    }
  };

  // Update the groupOrdersByBatch function
  const groupOrdersByBatch = (orders: Order[]) => {
    const grouped = orders.reduce((acc, order) => {
      if (order.batchID) {
        // If it's a batched order
        if (!acc[order.batchID]) {
          // Create new batch group
          acc[order.batchID] = {
            ...order,
            dropOff: [order.dropOff?.[0]],
            batchedOrders: [order],
          };
        } else {
          // Add to existing batch
          acc[order.batchID].dropOff.push(order.dropOff?.[0]);
          acc[order.batchID].batchedOrders?.push(order);
        }
      } else {
        // Non-batched orders use their ID as key
        acc[`single-${order.id}`] = order;  // Add 'single-' prefix to avoid ID conflicts
      }
      return acc;
    }, {} as Record<string, Order & { batchedOrders?: Order[] }>);

    return Object.values(grouped);
  };

  // Update the getFilteredOrders function
  const getFilteredOrders = () => {
    let filteredOrders = orders;
    
    switch (activeTab) {
      case 'Pending':
        filteredOrders = orders.filter(order => order.orderStatus === 'Assigned');
        break;
      case 'Complete':
        filteredOrders = orders.filter(order => order.orderStatus === 'Delivered');
        break;
      case 'Cancelled':
        filteredOrders = orders.filter(order => order.orderStatus === 'Cancelled');
        break;
    }

    return groupOrdersByBatch(filteredOrders);
  };

  const filteredOrders = getFilteredOrders();
  
  const handleSignOut = () => {
    localStorage.removeItem('authToken');
    router.push('/');
  };

  if (loading) {
    return <div className="p-4 text-center">Loading orders...</div>;
  }

  if (error) {
    return <div className="p-4 text-center text-red-500">{error}</div>;
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-6 md:p-6 max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-black">Orders</h1>
          <button
            onClick={handleSignOut}
            className="text-gray-600 hover:text-[#FE5B18] flex items-center"
          >
            <svg 
              className="w-5 h-5 mr-1" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
            </svg>
            Sign Out
          </button>
        </div>
        
        {/* Update tabs container padding */}
        <div className="flex gap-4 md:gap-6 border-b mb-6 overflow-x-auto pb-2">
          {(['Pending', 'Complete', 'Cancelled'] as FilterType[]).map((tab) => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`pb-2 relative ${
                activeTab === tab
                  ? 'text-black border-b-2 border-black'
                  : 'text-gray-500'
              }`}
            >
              {tab}{' '}
              <span className={`ml-1 ${
                activeTab === tab 
                  ? 'text-white bg-[#FE5B18] px-1.5 rounded-md' 
                  : 'text-gray-500'
              }`}>
                {getFilterCount(tab)}
              </span>
            </button>
          ))}
        </div>

        {/* Update cards container spacing */}
        <div className="space-y-4 md:space-y-6">
          {filteredOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order} 
              onRefresh={fetchOrders}
            />
          ))}
        </div>
      </div>
    </div>
  );
} 