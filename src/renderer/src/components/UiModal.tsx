import React from 'react';

interface ModalProps {
  id: string;
  title?: string; // Título é agora opcional
  isOpen: boolean;
  toggle: () => void;
  children: React.ReactNode;
  centered?: boolean; // Para controle de centralização
  showFooter?: boolean; // Para controle do rodapé
}

const Modal: React.FC<ModalProps> = ({ id, title, isOpen, toggle, children, centered = false, showFooter = false }) => {
  if (!isOpen) return null;

  return (
    <>
      <div 
        className={`modal fade ${isOpen ? 'show' : ''}`} 
        id={id} 
        tabIndex={-1} 
        aria-labelledby={`${id}Label`} 
        aria-hidden={!isOpen} 
        style={{ display: isOpen ? 'block' : 'none' }}
        data-bs-backdrop="static" // Configura o backdrop estático
        data-bs-keyboard="false"  // Desativa o fechamento com tecla ESC
      >
        <div className={`modal-dialog ${centered ? 'modal-dialog-centered' : ''}`}>
          <div className="modal-content">
            {title && ( // Renderiza o cabeçalho somente se o título for fornecido
              <div className="modal-header">
                <h5 className="modal-title" id={`${id}Label`}>{title}</h5>
                <button 
                  type="button" 
                  className="btn-close" 
                  onClick={toggle} 
                  aria-label="Close"
                ></button>
              </div>
            )}
            <div className="modal-body">
              {children}
            </div>
            {showFooter && ( // Condicional para exibir o rodapé
              <div className="modal-footer">
                <button type="button" className="btn btn-secondary" onClick={toggle}>Close</button>
                <button type="button" className="btn btn-primary">Understood</button>
              </div>
            )}
          </div>
        </div>
      </div>
      <div 
        className={`modal-backdrop fade ${isOpen ? 'show' : ''}`} 
        style={{ display: isOpen ? 'block' : 'none' }}
        onClick={toggle}
      ></div>
    </>
  );
};

export default Modal;
