// AddResponseModal.tsx
import { DialogDescription, DialogTitle, DialogTrigger } from '@radix-ui/react-dialog'
import { Button } from '@renderer/components/ui/button'
import { Dialog, DialogClose, DialogContent, DialogFooter, DialogHeader } from '@renderer/components/ui/dialog'
import { Input } from '@renderer/components/ui/input'
import { Label } from '@renderer/components/ui/label'
import React, { useState } from 'react'
import { Combobox } from '@igrp/igrp-design-system'
import { httpStatusCodes } from '@renderer/constants/appConstants'
interface AddResponseModalProps {
  onSave: (response: { name: string; statusCode: string; contentType: string }) => void
  responseTypes: any
}

const AddResponseModal: React.FC<AddResponseModalProps> = ({ onSave, responseTypes }) => {
  const [name, setName] = useState('')
  const [statusCode, setStatusCode] = useState('')
  const [contentType, setContentType] = useState('')

  const handleSave = () => {
    if (name && statusCode && contentType) {
      onSave({ name, statusCode, contentType })
      setName('')
      setStatusCode('')
      setContentType('')
    }
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        <button className="px-4 py-2 text-gray-500 hover:text-igrp">+ Add Status</button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Add a Response</DialogTitle>
          <DialogDescription />
        </DialogHeader>
        <form onSubmit={handleSave}>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label className="">Name</Label>
              <Input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-igrp focus:border-igrp"
                placeholder="Response Name"
              />
            </div>
            <div className="space-y-2">
              <Label className="">HTTP Status Code</Label>
              <Combobox
                options={httpStatusCodes}
                name="statusCode"
                value={statusCode}
                onChange={(value) => setStatusCode(value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-igrp focus:border-igrp"
                placeholder="e.g., 200, 400"
              />
            </div>
            <div className="space-y-2">
              <Label className="">Content Type</Label>
              <Combobox
                name={'contentType'}
                options={responseTypes}
                value={contentType}
                onChange={(value) => setContentType(value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-igrp focus:border-igrp"
              />
            </div>

            <DialogFooter>
              <DialogClose asChild>
                <Button type="button" variant="secondary">
                  Close
                </Button>
              </DialogClose>
              <Button type="submit">Save</Button>
            </DialogFooter>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}

export default AddResponseModal
