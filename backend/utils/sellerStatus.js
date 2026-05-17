const SELLER_STATUS_VALUES = ['active', 'inactive', 'on_hold', 'deleted'];

const SELLER_STATUS_LABELS = {
  active: 'Active',
  inactive: 'Inactive',
  on_hold: 'On Hold',
  deleted: 'Deleted / Left Account'
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

const normalizeSellerStatus = (value = 'active') => {
  const cleanValue = String(value || 'active').trim().toLowerCase().replace(/\s+/g, ' ');
  return SELLER_STATUS_ALIASES[cleanValue] || 'active';
};

module.exports = {
  SELLER_STATUS_VALUES,
  SELLER_STATUS_LABELS,
  normalizeSellerStatus
};
