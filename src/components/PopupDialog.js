import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Input } from '@mui/material'
import React, { useState } from 'react'

const PopupDialog = ({ isOpen, onOk, onCancel, data }) => {
    const [name, setName] = useState('');

    const handleOk = () => {
        onOk({ ...data, name }); // save name
        onCancel(); // Close popup
    };
  return (
      <Dialog maxWidth='md' open={isOpen} className='popup-container'>
        <DialogTitle>Create new name</DialogTitle>
        <DialogContent>
            <Input fullWidth placeholder='Enter name' value={name} onChange={e => setName(e.target.value)} />
        </DialogContent>
        <DialogActions>
              <Button onClick={onCancel}>Cancel</Button>
              <Button onClick={handleOk}>Save</Button>
        </DialogActions>
    </Dialog>
  )
}

export default PopupDialog
