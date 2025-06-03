
import React, { memo } from 'react';
import { Dialog, DialogTitle, DialogContent, DialogActions, TextField, Button } from '@mui/material';
import { Discount as DiscountIcon } from '@mui/icons-material';

const CouponDialog = memo(({ open, onClose, couponCode, setCouponCode, applyCoupon }) => (
  <Dialog open={open} onClose={onClose} maxWidth="xs" fullWidth>
    <DialogTitle className="flex items-center">
      <DiscountIcon className="mr-2 text-[#FF6200]" />
      Kupon qo‘shish
    </DialogTitle>
    <DialogContent>
      <TextField
        fullWidth
        label="Kupon kodi"
        value={couponCode}
        onChange={(e) => setCouponCode(e.target.value)}
        variant="outlined"
        margin="normal"
      />
    </DialogContent>
    <DialogActions>
      <Button onClick={onClose} color="inherit">
        Bekor qilish
      </Button>
      <Button
        onClick={applyCoupon}
        variant="contained"
        style={{ backgroundColor: '#FF6200', color: 'white' }}
      >
        Qo‘llash
      </Button>
    </DialogActions>
  </Dialog>
));

export default CouponDialog;
