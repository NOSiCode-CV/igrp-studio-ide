import React, { useState } from 'react';
import { Button, Nav, NavItem, NavLink, TabContent, TabPane } from 'reactstrap';
import classnames from 'classnames';
import PageBuilderContent from '../PageBuilderContent';
import FormEngine from '../FormEngine';
import styled from 'styled-components';
import { File } from 'src/main/types';
import { DroppedComponentsProvider } from '../dnd/DroppedComponentsContext';

const FixedTab = styled.div`
    position: fixed;
    width: 100%;
`;

interface ContentProps {
  basePath?: string,
  tabs: string[];
  activeTab: string;
  setActiveTab: (tab: string) => void;
  onPageClick: (page: string) => void;
  onCloseTab: (tab: string) => void;
}

const Content: React.FC<ContentProps> = ({ basePath, tabs, activeTab, setActiveTab, onPageClick, onCloseTab }) => {

  const [currentPage, setCurrentPage] = useState<File | null>(null);

  const handleClickOpenGerador = (pageFile: File) => {
    onPageClick(pageFile.name)
    setCurrentPage(pageFile)
  }

  return (
    <FixedTab className='navigation-page'>
      <Nav tabs className='nav-border-top nav-border-top-primary'>
        {tabs.map((tab) => (
          <NavItem key={tab} className="tab-item">
            <NavLink
              className={classnames({ active: activeTab === tab }, 'text-center m-0')}
              onClick={() => setActiveTab(tab)}
              style={{ cursor: 'pointer', width: tab === 'PageBuilder' ? '70px' : "auto" }}
            >
              {tab !== 'PageBuilder' ? (
                <>
                  <span>{tab}</span>
                  <Button
                    close
                    onClick={(e) => {
                      e.stopPropagation();
                      onCloseTab(tab);
                    }}
                    className="close-btn"
                  >
                    {/* <i className="ri ri-close-fill" /> */}
                  </Button>
                </>
              ) : (
                <i className='ri-pages-line fs-5' />
              )}

            </NavLink>
          </NavItem>
        ))}
      </Nav>
      <TabContent activeTab={activeTab}>
        {tabs.map((tab) => (
          <TabPane tabId={tab} key={tab}>
            {tab === 'PageBuilder' ? (
              <PageBuilderContent onPageClick={handleClickOpenGerador} />
            ) : (

              <DroppedComponentsProvider>
                <FormEngine basePath={basePath} page={tab} pagePath={currentPage?.path} />
              </DroppedComponentsProvider>
            )}
          </TabPane>
        ))}
      </TabContent>
    </FixedTab >
  );
};

export default Content;