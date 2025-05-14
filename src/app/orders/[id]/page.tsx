'use client';
import { useEffect, useState } from 'react';
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
  distance?: number;
}

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

export default function OrderDetails({ params }: { params: { id: string } }) {
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [otp, setOtp] = useState('');
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isPickingUp, setIsPickingUp] = useState(false);
  const [isDelivering, setIsDelivering] = useState(false);
  const [showDropoffOtp, setShowDropoffOtp] = useState(false);
  const [dropoffOtp, setDropoffOtp] = useState('');
  const [isVerifyingDropoff, setIsVerifyingDropoff] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const router = useRouter();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        const authToken = localStorage.getItem('authToken');
        if (!authToken) {
          router.push('/');
          return;
        }

        // Get user details to get phone number
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
        setPhoneNumber(userData.phoneNumber);

        // Fetch order details
        const response = await fetch(
          `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${params.id}`,
          {
            headers: {
              'X-Xano-Authorization': `Bearer ${authToken}`,
            }
          }
        );

        if (!response.ok) {
          throw new Error('Failed to fetch order details');
        }

        const orderData = await response.json();
        setOrder(orderData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load order details');
        console.error('Error fetching order:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [params.id, router]);

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifying(true);

    try {
      // Verify OTP
      const verifyResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/verify/otp/code/phoneNumber', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          OTP: parseInt(otp),
          contact: phoneNumber
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Invalid OTP code');
      }

      const verifyData = await verifyResponse.json();
      
      if (!verifyData.otpValidate) {
        throw new Error('Invalid OTP code');
      }

      setShowOtpInput(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleResendOtp = async () => {
    setError('');
    setIsVerifying(true);

    try {
      const response = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/login/phoneNumber/rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: phoneNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      alert('OTP resent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleViewRoute = () => {
    if (!order) return;

    const origin = encodeURIComponent(order.pickup?.[0]?.fromAddress || '');
    const destination = encodeURIComponent(order.dropOff?.[0]?.toAddress || '');
    const url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}`;
    window.open(url, '_blank');
  };

  const handleCall = (phoneNumber: string) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const getStatusColors = (status: string) => {
    return STATUS_COLORS[status as keyof typeof STATUS_COLORS] || STATUS_COLORS.ReadyForPickup;
  };

  const handlePickup = async () => {
    if (!order) return;
    
    setIsPickingUp(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/');
        return;
      }

      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Xano-Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            orderStatus: 'Pickup',
            orderPickedupTime: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: 'Pickup',
        orderPickedupTime: new Date().toISOString(),
      } : null);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update order status');
      console.error('Error updating order:', error);
    } finally {
      setIsPickingUp(false);
    }
  };

  const handleDeliver = async () => {
    if (!order) return;
    
    setIsDelivering(true);
    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/');
        return;
      }

      const response = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Xano-Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            orderStatus: 'OnTheWay',
            orderOnmywayTime: new Date().toISOString(),
          }),
        }
      );

      if (!response.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: 'OnTheWay',
        orderOnmywayTime: new Date().toISOString(),
      } : null);

    } catch (error) {
      setError(error instanceof Error ? error.message : 'Failed to update order status');
      console.error('Error updating order:', error);
    } finally {
      setIsDelivering(false);
    }
  };

  const handleDropoffOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsVerifyingDropoff(true);

    try {
      const authToken = localStorage.getItem('authToken');
      if (!authToken) {
        router.push('/');
        return;
      }

      // Verify OTP using the completion endpoint
      const verifyResponse = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/verifyCompletion', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          orderOTP: dropoffOtp
        })
      });

      if (!verifyResponse.ok) {
        throw new Error('Failed to verify OTP');
      }

      const verifyData = await verifyResponse.json();
      
      if (!verifyData) {
        throw new Error('Invalid OTP code. Please check with the customer and try again.');
      }

      // If OTP is valid, update order status to Delivered
      const updateResponse = await fetch(
        `https://api-server.krontiva.africa/api:uEBBwbSs/delikaquickshipper_orders_table/${order?.id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'X-Xano-Authorization': `Bearer ${authToken}`,
          },
          body: JSON.stringify({
            orderStatus: 'Delivered',
            orderCompletedTime: new Date().toISOString(),
          }),
        }
      );

      if (!updateResponse.ok) {
        throw new Error('Failed to update order status');
      }

      // Update local order state
      setOrder(prev => prev ? {
        ...prev,
        orderStatus: 'Delivered',
        orderCompletedTime: new Date().toISOString(),
      } : null);

      setShowDropoffOtp(false);
      setDropoffOtp('');
      setShowSuccess(true);

      // Hide success message after 3 seconds
      setTimeout(() => {
        setShowSuccess(false);
        router.push('/orders');
      }, 3000);

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Verification failed');
    } finally {
      setIsVerifyingDropoff(false);
    }
  };

  const handleResendDropoffOtp = async () => {
    setError('');
    setIsVerifyingDropoff(true);

    try {
      const response = await fetch('https://api-server.krontiva.africa/api:uEBBwbSs/auth/login/phoneNumber/rider', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          phoneNumber: order?.customerPhoneNumber
        })
      });

      if (!response.ok) {
        throw new Error('Failed to resend OTP');
      }

      alert('OTP resent successfully');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to resend OTP');
    } finally {
      setIsVerifyingDropoff(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-gray-200 rounded w-1/4"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
            <div className="h-32 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-red-500 text-center">{error}</div>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-white p-4">
        <div className="max-w-2xl mx-auto">
          <div className="text-center">Order not found</div>
        </div>
      </div>
    );
  }

  if (showOtpInput) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white px-4">
        <div className="max-w-md w-full space-y-8 p-4 md:p-8">
          <div>
            <h2 className="mt-6 text-center text-3xl font-bold text-black">
              Enter Verification Code
            </h2>
            <p className="mt-2 text-center text-sm text-gray-600">
              We sent a code to {phoneNumber}
            </p>
          </div>
          <form className="mt-8 space-y-6" onSubmit={handleOtpSubmit}>
            <div className="rounded-md shadow-sm space-y-4">
              <div>
                <label htmlFor="otp" className="sr-only">
                  Verification Code
                </label>
                <input
                  id="otp"
                  name="otp"
                  type="text"
                  inputMode="numeric"
                  pattern="\d*"
                  maxLength={4}
                  required
                  className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18] text-center text-2xl tracking-widest"
                  placeholder="••••"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                  disabled={isVerifying}
                />
                <button
                  type="button"
                  onClick={handleResendOtp}
                  disabled={isVerifying}
                  className="mt-2 text-sm text-[#FE5B18] hover:text-[#e54d0e] disabled:opacity-50"
                >
                  Resend Code
                </button>
              </div>
            </div>

            {error && (
              <div className="text-red-500 text-sm text-center">
                {error}
              </div>
            )}

            <div>
              <button
                type="submit"
                disabled={isVerifying}
                className="group relative w-full flex justify-center py-2 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-[#FE5B18] hover:bg-[#e54d0e] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#FE5B18] disabled:opacity-50"
              >
                {isVerifying ? (
                  <span className="flex items-center">
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                    </svg>
                    Verifying...
                  </span>
                ) : 'Verify'}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      <div className="px-4 py-6 md:p-6 max-w-2xl mx-auto">
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="text-gray-600 hover:text-[#FE5B18]"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-bold text-black">Order Details</h1>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-6 space-y-6">
          {/* Order Header */}
          <div className="flex justify-between items-start">
            <div>
              <h2 className="text-xl font-semibold text-black">{order.customerName}</h2>
              <div className="flex items-center gap-3 mt-1">
                <p className="text-gray-500">#{String(order.orderNumber).padStart(3, '0')}</p>
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

          {/* Order Details */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="font-semibold mb-2 text-black">Pickup Location</h3>
              <p className="text-gray-600">
                {order.pickup?.[0]?.fromAddress || 'N/A'}
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-2 text-black">Dropoff Location</h3>
              <p className="text-gray-600">
                {order.dropOff?.[0]?.toAddress || 'N/A'}
              </p>
            </div>
          </div>

          {/* Order Timeline */}
          <div>
            <h3 className="font-semibold mb-3 text-black">Order Timeline</h3>
            <div className="space-y-2">
              {order.orderReceivedTime && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FE5B18]"></div>
                  <p className="text-sm text-gray-600">
                    Order Received: {new Date(order.orderReceivedTime).toLocaleString()}
                  </p>
                </div>
              )}
              {order.orderPickedupTime && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FE5B18]"></div>
                  <p className="text-sm text-gray-600">
                    Picked Up: {new Date(order.orderPickedupTime).toLocaleString()}
                  </p>
                </div>
              )}
              {order.orderOnmywayTime && (
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-[#FE5B18]"></div>
                  <p className="text-sm text-gray-600">
                    On the Way: {new Date(order.orderOnmywayTime).toLocaleString()}
                  </p>
                </div>
              )}
            </div>
          </div>

          {/* Order Summary */}
          <div className="border-t pt-4">
            <div className="flex justify-between items-center">
              <div>
                <p className="text-sm text-gray-500">Delivery Price</p>
                <p className="text-xl font-bold text-black">
                  {(order.deliveryPrice || 0)} GHS
                </p>
              </div>
              <div className="flex items-center gap-4">
                {order.orderStatus === 'Assigned' && (
                  <button 
                    onClick={handlePickup}
                    disabled={isPickingUp}
                    className="text-white font-medium flex items-center bg-[#FE5B18] px-4 py-2 rounded-md hover:bg-[#e54d0e] disabled:opacity-50"
                  >
                    {isPickingUp ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Picking Up...
                      </span>
                    ) : (
                      <>
                        <svg 
                          className="w-4 h-4 mr-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                        Pickup
                      </>
                    )}
                  </button>
                )}
                {order.orderStatus === 'Pickup' && (
                  <button 
                    onClick={handleDeliver}
                    disabled={isDelivering}
                    className="text-white font-medium flex items-center bg-[#FE5B18] px-4 py-2 rounded-md hover:bg-[#e54d0e] disabled:opacity-50"
                  >
                    {isDelivering ? (
                      <span className="flex items-center">
                        <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                        </svg>
                        Starting Delivery...
                      </span>
                    ) : (
                      <>
                        <svg 
                          className="w-4 h-4 mr-1" 
                          fill="none" 
                          stroke="currentColor" 
                          viewBox="0 0 24 24"
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        Deliver Item
                      </>
                    )}
                  </button>
                )}
                {order.orderStatus === 'OnTheWay' && (
                  <button 
                    onClick={() => setShowDropoffOtp(true)}
                    className="text-white font-medium flex items-center bg-[#FE5B18] px-4 py-2 rounded-md hover:bg-[#e54d0e]"
                  >
                    <svg 
                      className="w-4 h-4 mr-1" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                    </svg>
                    Drop off
                  </button>
                )}
                {order.orderStatus !== 'Delivered' && order.orderStatus !== 'Cancelled' && (
                  <button 
                    className="text-[#FE5B18] font-medium flex items-center"
                    onClick={handleViewRoute}
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
                )}
              </div>
            </div>

            {/* Drop off OTP Section */}
            {showDropoffOtp && order.orderStatus === 'OnTheWay' && (
              <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                <h3 className="text-lg font-semibold mb-3">Verify Drop off</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Enter the 4-digit code provided by the customer to complete the delivery.
                </p>
                <form onSubmit={handleDropoffOtpSubmit} className="space-y-4">
                  <div>
                    <input
                      type="text"
                      inputMode="numeric"
                      pattern="\d*"
                      maxLength={4}
                      required
                      className="appearance-none rounded-lg relative block w-full px-3 py-2 border border-gray-300 placeholder-gray-500 text-gray-900 focus:outline-none focus:ring-[#FE5B18] focus:border-[#FE5B18] text-center text-2xl tracking-widest"
                      placeholder="••••"
                      value={dropoffOtp}
                      onChange={(e) => setDropoffOtp(e.target.value.replace(/\D/g, ''))}
                      disabled={isVerifyingDropoff}
                    />
                  </div>

                  {error && (
                    <div className="text-red-500 text-sm text-center">
                      {error}
                    </div>
                  )}

                  <div className="flex gap-4">
                    <button
                      type="submit"
                      disabled={isVerifyingDropoff}
                      className="flex-1 text-white font-medium flex items-center justify-center bg-[#FE5B18] px-4 py-2 rounded-md hover:bg-[#e54d0e] disabled:opacity-50"
                    >
                      {isVerifyingDropoff ? (
                        <span className="flex items-center">
                          <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"/>
                          </svg>
                          Verifying...
                        </span>
                      ) : 'Verify & Complete Delivery'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setShowDropoffOtp(false)}
                      disabled={isVerifyingDropoff}
                      className="text-gray-600 font-medium flex items-center justify-center px-4 py-2 rounded-md hover:bg-gray-100 disabled:opacity-50"
                    >
                      Cancel
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Success Message */}
            {showSuccess && (
              <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                <div className="bg-white rounded-lg p-8 max-w-sm w-full mx-4 text-center">
                  <div className="w-24 h-24 mx-auto mb-4">
                    <svg 
                      className="w-full h-full text-green-500" 
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path 
                        strokeLinecap="round" 
                        strokeLinejoin="round" 
                        strokeWidth={2} 
                        d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" 
                      />
                    </svg>
                  </div>
                  <h3 className="text-xl font-bold text-gray-900 mb-2">Delivery Completed!</h3>
                  <p className="text-gray-600">The order has been successfully delivered.</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
} 