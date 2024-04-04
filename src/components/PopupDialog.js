import { Button, Dialog, DialogActions, DialogContent, DialogTitle, Input } from '@mui/material'
import React, { useEffect, useState } from 'react'

const PopupDialog = ({ mode,isOpen, onOk, onCancel, data }) => {
    const [name, setName] = useState('');
    const title = mode === 'create' ? 'Create new name' : 'Change name'

  useEffect(() => {
    if (mode === 'changeName' && data && data.properties && data.properties.name) {
      setName(data.properties.name);
    } else {
      setName('');  // Reset Name
    }
  }, [mode, data, isOpen]);
  const handleOk = () => {
    onOk({ ...data, properties: { ...data.properties, name } });
    onCancel();  // Close Popup
  };
  return (
      <Dialog maxWidth='md' open={isOpen} className='popup-container'>
        <DialogTitle>{title}</DialogTitle>
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
