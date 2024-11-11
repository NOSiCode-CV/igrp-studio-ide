import { Component } from '@igrp/nextjs-engine/dist/interfaces/types';
import { buildJsonStructure } from '@renderer/utils/jsonStructureUtil';
import React from 'react';
import { Button } from 'reactstrap';
import { useDroppedComponents } from '../dnd/DroppedComponentsContext';
import { useTranslation } from 'react-i18next';

interface BreadCrumbProps {
    isDesign: boolean,
    onClickIsDesign: () => void,
    onSave: (jsonStructure: Component[]) => void
}

/* const StyledDiv = styled.div`
   margin-top: -40px;
   width: auto;
   right: 0;
   left: auto;
   position: absolute;
`; */

const BreadCrumb = ({ isDesign, onClickIsDesign, onSave }: BreadCrumbProps): JSX.Element => {

    const { getAllComponents } = useDroppedComponents();
    const components = getAllComponents();

    const { t } = useTranslation();

    const handleSaveClick = () => {
        const jsonStructure = buildJsonStructure(components);
        onSave(jsonStructure);
    }

    return (
        <React.Fragment>
            <div>
                <div className="page-title-box d-flex align-items-center justify-content-between pt-1 pb-0">
                    <div className='d-flex align-items-center gap-2'>
                        <Button
                            color='light'
                            size='sm'
                            className='btn-outline-dark'
                            title='Preview Page'
                        >
                            <i className='ri-eye-fill' />
                        </Button>
                        <Button
                            color={isDesign ? 'primary' : 'light'}
                            size='sm'
                            onClick={() => onClickIsDesign()}
                            className='btn-outline-dark'
                            title={isDesign ? 'Show Code' : 'Show Design'}
                        >
                            {isDesign ? (<i className='ri-layout-2-line' />)
                                : (<i className='ri-code-s-slash-line' />)
                            }
                        </Button>
                        <Button className='btn-save' size='sm' onClick={handleSaveClick} title="Add Components to Page">{t('save')}</Button>
                    </div>

                </div>
            </div>
        </React.Fragment>
    );
};

export default BreadCrumb;