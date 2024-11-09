import { useState } from "react";
import { Dropdown, DropdownItem, DropdownMenu, DropdownToggle } from "reactstrap";

interface RowOptionsProps {
    onClickAddControl: (type: string) => void;
    onClickStructure: (layout: string) => void;
    onClickDeleteSection: () => void;
}
const RowOptions = ({ onClickAddControl, onClickStructure, onClickDeleteSection }: RowOptionsProps) => {
    const [dropdownOpen, setDropdownOpen] = useState(false);

    const toggle = () => setDropdownOpen((prevState) => !prevState);

    const closeDropdown = () => setDropdownOpen(false);

    return (
        <>
            <div className="text-light add-row-control d-flex align-items-center justify-content-center"
                data-bs-toggle="tooltip" data-bs-placement="top" title="Add New Row"
                onClick={() => onClickAddControl("bottom")}>
                <i className="ri ri-add-fill"></i>
            </div>

            <div className="text-light add-row-control control-top d-flex align-items-center justify-content-center"
                data-bs-toggle="tooltip" data-bs-placement="top" title="Add New Row"
                onClick={() => onClickAddControl("top")}>
                <i className="ri ri-add-fill"></i>
            </div>

            <div className="row-options">
                <ul>
                    <li className="d-flex align-items-center" rel="move" data-bs-toggle="tooltip" data-bs-title="Ordenar" >
                        <a className="btn-small d-flex align-items-center move-row" href="#"
                            onClick={(e) => e.preventDefault()}>
                            <span className="small d-none">Mover</span>
                            <i className="ri-drag-move-2-fill"></i>
                        </a>
                    </li>

                    <li className="d-flex align-items-center" rel="clone" data-bs-toggle="tooltip" data-bs-title="Clonar" >
                        <a className="btn-small d-flex align-items-center clone-row" href="#"
                            onClick={(e) => e.preventDefault()}>
                            <span className="small d-none">Clonar</span>
                            <i className=" ri-file-copy-line"></i>
                        </a>
                    </li>

                    <li className="d-flex align-items-center" rel="columns" data-bs-toggle="tooltip" data-bs-title="Estrutura" >

                        <Dropdown isOpen={dropdownOpen} toggle={toggle} size="sm" onMouseLeave={closeDropdown}>
                            <DropdownToggle
                                tag="a"
                                className="btn-small add-columns">
                                <span className="small d-none">Grid</span>
                                <i className="ri ri-layout-grid-line"></i>
                            </DropdownToggle>
                            <DropdownMenu className="pt-0">
                                <DropdownItem header >Estrutura</DropdownItem>
                                <div className="p-3">
                                    <div className="row-structures-wrapper row g-3">
                                        {[[12], [6, 6], [4, 4, 4], [3, 3, 3, 3], [8, 4], [4, 8], [9, 3], [3, 9], [10, 2], [2, 10]].map((r, index) => (
                                            <div className="col-3" key={index} onClick={() => onClickStructure(r.join(','))}>
                                                <div className="row gx-1 column-setter" data-layout={`${r.join(',')}`}>
                                                    {r.map((c, i) => (
                                                        <div className={`col-${c}`} key={i}>
                                                            <div className="struc-col-inner"></div>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </DropdownMenu>
                        </Dropdown>
                    </li>

                    <li
                        className="d-flex align-items-center"
                        rel="delete-row"
                        data-bs-toggle="tooltip"
                        data-bs-title="Eliminar Seção"
                        onClick={(e) => {
                            e.preventDefault();
                            onClickDeleteSection();
                        }}
                    >
                        <a className="btn-small d-flex align-items-center" href="#">
                            <i className="ri-delete-bin-line"></i>
                        </a>
                    </li>

                </ul>
                <input type="text" className="row-class-setter" placeholder="ROW" />

            </div>
        </>
    )
}

export default RowOptions;