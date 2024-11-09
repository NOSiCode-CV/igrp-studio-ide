import React from "react";
import { Modal, ModalBody } from "reactstrap";

interface DeleteModalProps {
  show?: boolean;
  onDeleteClick?: () => void;
  onCloseClick?: () => void;
  recordId?: string;
}

const DeleteModal: React.FC<DeleteModalProps> = ({ show, onDeleteClick, onCloseClick, recordId }) => {
  return (
    <Modal fade={true} isOpen={show} toggle={onCloseClick} centered={true}>
      <ModalBody className="py-6 px-10">
        <div className="mt-2 text-center">
          <i className="ri-delete-bin-line text-5xl text-red-600"></i>
          <div className="mt-4 pt-2 text-lg mx-4 sm:mx-6">
            <h4 className="text-xl font-semibold">Are you sure?</h4>
            <p className="text-gray-600 mt-2 mx-4 mb-0">
              Are you sure you want to remove this record {recordId ? recordId : ""}?
            </p>
          </div>
        </div>
        <div className="flex gap-4 justify-center mt-6 mb-2">
          <button
            type="button"
            className="btn w-24 bg-gray-100 hover:bg-gray-200 text-gray-700 rounded"
            onClick={onCloseClick}
          >
            Close
          </button>
          <button
            type="button"
            className="btn w-24 bg-red-600 hover:bg-red-700 text-white rounded"
            id="delete-record"
            onClick={onDeleteClick}
          >
            Yes, Delete It!
          </button>
        </div>
      </ModalBody>
    </Modal>
  ) as unknown as JSX.Element;
};

export default DeleteModal;
