import React, { Suspense, lazy, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import DashboardRoundedIcon from '@mui/icons-material/DashboardRounded';
import Inventory2RoundedIcon from '@mui/icons-material/Inventory2Rounded';
import FmdGoodRoundedIcon from '@mui/icons-material/FmdGoodRounded';
import ReceiptLongRoundedIcon from '@mui/icons-material/ReceiptLongRounded';
import PaymentsRoundedIcon from '@mui/icons-material/PaymentsRounded';
import PersonRoundedIcon from '@mui/icons-material/PersonRounded';
import SettingsRoundedIcon from '@mui/icons-material/SettingsRounded';
import { Typography } from '@mui/material';
import API from '../../../api/api';
import AppToast from '../../../components/common/AppToast';
import ConfirmDialog from '../../../components/common/ConfirmDialog';
import PageLoader from '../../../components/common/PageLoader';
import UserPortalLayout from '../../../components/layouts/user/UserPortalLayout';
import UserPortalSidebar from '../../../components/layouts/user/UserPortalSidebar';
import useToast from '../../../hooks/useToast';
import { useThemeMode } from '../../../context/ThemeModeContext';
import ProfileSection from '../sections/ProfileSection';
import SettingsSection from '../sections/SettingsSection';

const UserPortalOverviewSection = lazy(() => import('./sections/UserPortalOverviewSection'));
const UserCatalogSection = lazy(() => import('./sections/UserCatalogSection'));
const UserNearbySellersSection = lazy(() => import('./sections/UserNearbySellersSection'));
const UserOrdersSection = lazy(() => import('./sections/UserOrdersSection'));
const UserCheckoutSection = lazy(() => import('./sections/UserCheckoutSection'));

const routeToSection = {
  '/user-portal': 'overview',
  '/user-portal/catalog': 'catalog',
  '/user-portal/sellers': 'sellers',
  '/user-portal/orders': 'orders',
  '/user-portal/checkout': 'checkout',
  '/user-portal/profile': 'profile',
  '/user-portal/settings': 'settings'
};

function UserPortal() {
  const navigate = useNavigate();
  const location = useLocation();
  const { mode, toggleColorMode } = useThemeMode();
  const userId = localStorage.getItem('userId') || '';
  const name = localStorage.getItem('name') || 'User';
  const loginAs = localStorage.getItem('loginAs') || 'user';
  const sessionExpiry = Number(localStorage.getItem('sessionExpiry'));
  const activeSection = routeToSection[location.pathname] || 'overview';
  const fileInputRef = useRef(null);
  const { toast, showToast, closeToast } = useToast();

  const [mobileOpen, setMobileOpen] = useState(false);
  const [profileImage, setProfileImage] = useState(localStorage.getItem('profileImage') || '');
  const [logoutDialogOpen, setLogoutDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [isDeletingAccount, setIsDeletingAccount] = useState(false);
  const [now, setNow] = useState(Date.now());
  const [ordersRefreshKey, setOrdersRefreshKey] = useState(0);
  const [profileDetails, setProfileDetails] = useState({
    name,
    userId,
    loginAs: 'user',
    phoneNo: '',
    gender: 'other',
    address: '',
    status: 'Not Active',
    dateOfJoining: null,
    department: '',
    position: '',
    dateOfExit: null,
    userCategory: '',
    noOfBookings: 0,
    documents: [],
    education: []
  });
  const [selectedProduct, setSelectedProduct] = useState(() => {
    const stored = localStorage.getItem('userSelectedProduct');
    if (!stored) return null;

    try {
      return JSON.parse(stored);
    } catch (error) {
      localStorage.removeItem('userSelectedProduct');
      return null;
    }
  });

  const navItems = useMemo(
    () => [
      { key: 'overview', label: 'Overview', icon: <DashboardRoundedIcon />, route: '/user-portal' },
      { key: 'catalog', label: 'Rent Products', icon: <Inventory2RoundedIcon />, route: '/user-portal/catalog' },
      { key: 'sellers', label: 'Nearby Sellers', icon: <FmdGoodRoundedIcon />, route: '/user-portal/sellers' },
      { key: 'orders', label: 'My Orders', icon: <ReceiptLongRoundedIcon />, route: '/user-portal/orders' },
      { key: 'checkout', label: 'Checkout', icon: <PaymentsRoundedIcon />, route: '/user-portal/checkout' },
      { key: 'profile', label: 'Profile', icon: <PersonRoundedIcon />, route: '/user-portal/profile' },
      { key: 'settings', label: 'Settings', icon: <SettingsRoundedIcon />, route: '/user-portal/settings' }
    ],
    []
  );

  useEffect(() => {
    if (loginAs !== 'user') {
      navigate('/dashboard', { replace: true });
    }
  }, [loginAs, navigate]);

  useEffect(() => {
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, []);

  const clearStoredSession = useCallback(() => {
    localStorage.removeItem('name');
    localStorage.removeItem('userId');
    localStorage.removeItem('sessionExpiry');
    localStorage.removeItem('profileImage');
    localStorage.removeItem('loginAs');
    localStorage.removeItem('userSelectedProduct');
  }, []);

  const markUserNotActive = useCallback(async () => {
    if (!userId) return;
    try {
      await API.post('/logoutUser', { userId });
    } catch (error) {
      // local logout still proceeds
    }
  }, [userId]);

  useEffect(() => {
    if (!userId || !name) {
      navigate('/', { replace: true });
      return;
    }

    if (!sessionExpiry || Number.isNaN(sessionExpiry) || now > sessionExpiry) {
      markUserNotActive();
      clearStoredSession();
      navigate('/', { replace: true });
    }
  }, [clearStoredSession, markUserNotActive, name, navigate, now, sessionExpiry, userId]);

  const fetchProfile = useCallback(async () => {
    if (!userId) return;
    try {
      const res = await API.get(`/user/${userId}`);
      const profile = res.data?.user || {};
      const image = profile.profileImage || '';
      setProfileImage(image);
      localStorage.setItem('profileImage', image);
      setProfileDetails({
        name: profile.name || name,
        userId: profile.userId || userId,
        loginAs: profile.loginAs || 'user',
        phoneNo: profile.phoneNo || '',
        gender: profile.gender || 'other',
        address: profile.address || '',
        status: profile.status || 'Not Active',
        dateOfJoining: profile.dateOfJoining || null,
        department: '',
        position: '',
        dateOfExit: null,
        userCategory: profile.userCategory || '',
        noOfBookings: profile.noOfBookings || 0,
        documents: [],
        education: []
      });
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to load profile.', 'error');
    }
  }, [name, showToast, userId]);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  useEffect(() => {
    if (selectedProduct) {
      localStorage.setItem('userSelectedProduct', JSON.stringify(selectedProduct));
    } else {
      localStorage.removeItem('userSelectedProduct');
    }
  }, [selectedProduct]);

  const handleLogout = async () => {
    await markUserNotActive();
    clearStoredSession();
    showToast('You have been logged out.', 'info');
    navigate('/');
  };

  const handleDeleteAccount = async () => {
    try {
      setIsDeletingAccount(true);
      await API.delete(`/deleteUser/${userId}`);
      clearStoredSession();
      navigate('/');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to delete account.', 'error');
    } finally {
      setIsDeletingAccount(false);
      setDeleteDialogOpen(false);
    }
  };

  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });

  const handleChooseProfileImage = () => {
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  };

  const handleProfileImageUpload = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      showToast('Please select a valid image file.', 'warning');
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      showToast('Image must be 2MB or smaller.', 'warning');
      return;
    }

    try {
      setIsUploadingImage(true);
      const base64Image = await fileToBase64(file);
      await API.post('/updateProfileImage', {
        userId,
        profileImage: base64Image
      });
      setProfileImage(base64Image);
      localStorage.setItem('profileImage', base64Image);
      showToast('Profile picture updated successfully.', 'success');
    } catch (error) {
      showToast(error.response?.data?.message || 'Failed to update profile picture.', 'error');
    } finally {
      setIsUploadingImage(false);
      event.target.value = '';
    }
  };

  const handleSectionChange = (sectionKey) => {
    const selectedNav = navItems.find((item) => item.key === sectionKey);
    setMobileOpen(false);
    if (selectedNav?.route) {
      navigate(selectedNav.route);
    }
  };

  const handleOrderPlaced = useCallback(() => {
    setOrdersRefreshKey((prev) => prev + 1);
    setSelectedProduct(null);
    fetchProfile();
    navigate('/user-portal/orders');
  }, [fetchProfile, navigate]);

  const sectionRenderer = {
    overview: <UserPortalOverviewSection userId={userId} showToast={showToast} key={`overview-${ordersRefreshKey}`} />,
    catalog: (
      <UserCatalogSection
        userId={userId}
        selectedProduct={selectedProduct}
        onSelectProduct={setSelectedProduct}
        showToast={showToast}
      />
    ),
    sellers: (
      <UserNearbySellersSection
        userId={userId}
        selectedProduct={selectedProduct}
        showToast={showToast}
      />
    ),
    orders: <UserOrdersSection userId={userId} refreshKey={ordersRefreshKey} showToast={showToast} />,
    checkout: (
      <UserCheckoutSection
        userId={userId}
        selectedProduct={selectedProduct}
        profileDetails={profileDetails}
        showToast={showToast}
        onOrderPlaced={handleOrderPlaced}
      />
    ),
    profile: (
      <ProfileSection
        profileImage={profileImage}
        name={profileDetails.name}
        userId={profileDetails.userId}
        loginAs={profileDetails.loginAs}
        phoneNo={profileDetails.phoneNo}
        gender={profileDetails.gender}
        address={profileDetails.address}
        status={profileDetails.status}
        dateOfJoining={profileDetails.dateOfJoining}
        department={profileDetails.department}
        position={profileDetails.position}
        dateOfExit={profileDetails.dateOfExit}
        userCategory={profileDetails.userCategory}
        noOfBookings={profileDetails.noOfBookings}
        documents={profileDetails.documents}
        education={profileDetails.education}
        fileInputRef={fileInputRef}
        handleProfileImageUpload={handleProfileImageUpload}
        handleChooseProfileImage={handleChooseProfileImage}
        isUploadingImage={isUploadingImage}
      />
    ),
    settings: (
      <SettingsSection
        mode={mode}
        toggleColorMode={toggleColorMode}
        setLogoutDialogOpen={setLogoutDialogOpen}
        setDeleteDialogOpen={setDeleteDialogOpen}
        canDeleteAccount
      />
    )
  };

  const sidebarContent = (
    <UserPortalSidebar
      navItems={navItems}
      activeSection={activeSection}
      desktopCollapsed={false}
      onSectionChange={handleSectionChange}
    />
  );

  const activeContent = sectionRenderer[activeSection] || sectionRenderer.overview;

  if (loginAs !== 'user') {
    return null;
  }

  return (
    <>
      <UserPortalLayout
        desktopCollapsed={false}
        mobileOpen={mobileOpen}
        onMobileClose={() => setMobileOpen(false)}
        name={name}
        profileImage={profileImage}
        onToggleMobile={() => setMobileOpen((prev) => !prev)}
        sidebarContent={sidebarContent}
      >
        <Suspense fallback={<PageLoader message="Loading user portal..." minHeight={320} />}>
          {activeContent}
        </Suspense>
      </UserPortalLayout>

      <ConfirmDialog
        open={logoutDialogOpen}
        title="Confirm Logout"
        description="Do you want to logout from your current user session?"
        onClose={() => setLogoutDialogOpen(false)}
        onConfirm={handleLogout}
        confirmLabel="Logout"
        confirmColor="error"
      />

      <ConfirmDialog
        open={deleteDialogOpen}
        title="Delete Account"
        onClose={() => setDeleteDialogOpen(false)}
        onConfirm={handleDeleteAccount}
        confirmLabel={isDeletingAccount ? 'Deleting...' : 'Delete'}
        confirmColor="error"
        confirmDisabled={isDeletingAccount}
        cancelDisabled={isDeletingAccount}
      >
        <Typography color="error" fontWeight={700} sx={{ mb: 1 }}>
          This action cannot be undone.
        </Typography>
        <Typography>
          Are you sure you want to permanently delete your user account?
        </Typography>
      </ConfirmDialog>

      <AppToast
        open={toast.open}
        message={toast.message}
        severity={toast.severity}
        onClose={closeToast}
      />
    </>
  );
}

export default UserPortal;
