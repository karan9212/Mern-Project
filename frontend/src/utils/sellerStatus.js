export const SELLER_STATUS_ORDER = ['active', 'inactive', 'on_hold', 'deleted'];

export const SELLER_STATUS_META = {
  active: {
    label: 'Active',
    color: 'success',
    mapColor: '#2e7d32'
  },
  inactive: {
    label: 'Inactive',
    color: 'warning',
    mapColor: '#ed6c02'
  },
  on_hold: {
    label: 'On Hold',
    color: 'secondary',
    mapColor: '#7b1fa2'
  },
  deleted: {
    label: 'Deleted / Left',
    color: 'error',
    mapColor: '#d32f2f'
  }
};

const SELLER_STATUS_ALIASES = {
  active: 'active',
  inactive: 'inactive',
  paused: 'on_hold',
  hold: 'on_hold',
  'on hold': 'on_hold',
  'on-hold': 'on_hold',
  on_hold: 'on_hold',
  discontinued: 'on_hold',
  deleted: 'deleted',
  closed: 'deleted',
  left: 'deleted',
  'left account': 'deleted',
  'left-account': 'deleted',
  left_account: 'deleted'
};

export const normalizeSellerStatus = (value = 'active') => {
  const cleanValue = String(value || 'active').trim().toLowerCase().replace(/\s+/g, ' ');
  return SELLER_STATUS_ALIASES[cleanValue] || 'active';
};

export const getSellerStatusMeta = (value) => {
  const normalizedStatus = normalizeSellerStatus(value);
  return SELLER_STATUS_META[normalizedStatus] || SELLER_STATUS_META.active;
};
