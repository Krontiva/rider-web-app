'use client';
import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import PricingPreferences from '../components/PricingPreferences';

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
  distance?: number;
}

type FilterType = 'Pending' | 'Complete' | 'Cancelled';
type OrderType = 'All' | 'Batched' | 'Single';

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
}

const OrderCard = ({ order }: OrderCardProps) => {
  const router = useRouter();

  const getStatusColors = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ReadyForPickup;
  };

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  if (order.batchID && order.batchedOrders) {
    // Calculate total amount from all orders in the batch
    const totalAmount = order.batchedOrders.reduce((sum, batchOrder) => 
      sum + (Number(batchOrder.deliveryPrice) || 0), 
    0).toFixed(2);

    return (
      <div 
        onClick={() => router.push(`/orders/${order.id}`)}
        className="bg-[#FFF8E1] p-4 rounded-lg shadow mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
      >
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
                <div className="flex justify-between items-start">
                  <div>
                    <span className="text-gray-600">Order #{batchedOrder.orderNumber}</span>
                    <p
                      className="text-sm text-gray-500"
                      style={{
                        display: '-webkit-box',
                        WebkitLineClamp: 2,
                        WebkitBoxOrient: 'vertical',
                        overflow: 'hidden',
                      }}
                    >
                      {batchedOrder.dropOff?.[0]?.toAddress || ''}
                    </p>
                    {batchedOrder.customerPhoneNumber && (
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCall(batchedOrder.customerPhoneNumber);
                        }}
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
                  <div className="text-right">
                    <span className="text-sm font-medium text-black">
                      {(batchedOrder.deliveryPrice || 0)} GHS
                    </span>
                    {batchedOrder.distance && (
                      <p className="text-xs text-gray-500">
                        {batchedOrder.distance} km
                      </p>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
          <div className="mt-3">
            <p className="font-semibold mb-1">Pickup Point</p>
            <p
              className="text-gray-600"
              style={{
                display: '-webkit-box',
                WebkitLineClamp: 2,
                WebkitBoxOrient: 'vertical',
                overflow: 'hidden',
              }}
            >
              {order.pickup?.[0]?.fromAddress || ''}
            </p>
          </div>
        </div>

        <div className="flex justify-between items-center">
          <span className="text-lg font-bold text-black">
            {totalAmount} GHS
          </span>
        </div>
      </div>
    );
  }

  return (
    <div 
      onClick={() => router.push(`/orders/${order.id}`)}
      className="bg-white p-4 rounded-lg shadow mb-4 cursor-pointer hover:shadow-md transition-shadow duration-200"
    >
      <div className="flex justify-between items-start mb-4">
        <div>
          <h3 className="text-lg font-semibold text-black">{order.customerName}</h3>
          <div className="flex items-center gap-3">
            <span className="text-gray-500 text-sm">
              #{String(order.orderNumber).padStart(3, '0')}
            </span>
            {order.customerPhoneNumber && (
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  handleCall(order.customerPhoneNumber);
                }}
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
          <p
            className="text-gray-600"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {order.pickup?.[0]?.fromAddress || ''}
          </p>
        </div>
        <div className="flex-1">
          <p className="font-semibold mb-1 text-black">Dropoff</p>
          <p
            className="text-gray-600"
            style={{
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden',
            }}
          >
            {order.dropOff?.[0]?.toAddress || ''}
          </p>
        </div>
      </div>

      <div className="flex justify-between items-center">
        <span className="text-lg font-bold text-black">
          {(order.deliveryPrice || 0)} GHS
        </span>
      </div>
    </div>
  );
};

export default function Orders() {
  const [activeTab, setActiveTab] = useState<FilterType>('Pending');
  const [orderType, setOrderType] = useState<OrderType>('All');
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [isPricingModalOpen, setIsPricingModalOpen] = useState(false);
  const itemsPerPage = 10;
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
      const courierId = userData.id;

      // Fetch orders assigned to this courier
      const ordersResponse = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/getRiderOrders/${courierId}`,
        {
          headers: {
            'X-Xano-Authorization': `Bearer ${authToken}`,
          },
        }
      );

      if (!ordersResponse.ok) {
        throw new Error('Failed to fetch orders');
      }

      const riderOrders = await ordersResponse.json();

      setOrders(riderOrders);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load orders');

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
    
    // First filter by status
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


    // Then filter by order type
    switch (orderType) {
      case 'Batched':
        filteredOrders = filteredOrders.filter(order => order.batchID);
        break;
      case 'Single':
        filteredOrders = filteredOrders.filter(order => !order.batchID);
        break;
      default:
        // 'All' - no additional filtering needed
        break;
    }

    return groupOrdersByBatch(filteredOrders);
  };

  const filteredOrders = getFilteredOrders();
  
  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedOrders = filteredOrders.slice(startIndex, startIndex + itemsPerPage);

  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [activeTab, orderType]);

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
    // Scroll to top of orders list
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

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
          <div className="flex items-center gap-4">
            <button
              onClick={() => setIsPricingModalOpen(true)}
              className="text-gray-600 hover:text-[#FE5B18] flex items-center"
            >
              <svg 
                className="w-5 h-5 mr-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
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
        </div>
        
        {/* Status Tabs */}
        <div className="flex gap-4 md:gap-6 border-b mb-4 overflow-x-auto pb-2">
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

        {/* Order Type Filters and Pagination */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex gap-4">
            {(['All', 'Batched', 'Single'] as OrderType[]).map((type) => (
              <button
                key={type}
                onClick={() => setOrderType(type)}
                className={`px-4 py-2 rounded-full text-sm font-medium ${
                  orderType === type
                    ? 'bg-[#FE5B18] text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {type}
              </button>
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => handlePageChange(currentPage - 1)}
                disabled={currentPage === 1}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                  <button
                    key={page}
                    onClick={() => handlePageChange(page)}
                    className={`w-8 h-8 rounded-full text-sm font-medium ${
                      currentPage === page
                        ? 'bg-[#FE5B18] text-white'
                        : 'text-gray-600 hover:bg-gray-100'
                    }`}
                  >
                    {page}
                  </button>
                ))}
              </div>

              <button
                onClick={() => handlePageChange(currentPage + 1)}
                disabled={currentPage === totalPages}
                className="p-2 rounded-full text-gray-600 hover:bg-gray-100 disabled:opacity-50 disabled:hover:bg-transparent"
              >
                <svg 
                  className="w-5 h-5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          )}
        </div>

        {/* Orders List */}
        <div className="space-y-4 md:space-y-6">
          {paginatedOrders.map((order) => (
            <OrderCard 
              key={order.id} 
              order={order}
            />
          ))}
        </div>

        {/* No Orders Message */}
        {paginatedOrders.length === 0 && !loading && (
          <div className="text-center py-8">
            <p className="text-gray-500">No orders found</p>
          </div>
        )}

        {/* Add PricingPreferences modal */}
        <PricingPreferences 
          open={isPricingModalOpen} 
          onOpenChange={setIsPricingModalOpen} 
        />
      </div>
    </div>
  );
} 