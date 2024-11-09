import { FunctionComponent } from 'react'
import * as React from 'react/jsx-runtime'
import { Container, Label, Row, Table } from 'reactstrap'
import Select from 'react-select'

interface ContraintContainerProps {
  validation: any
}

export const ContraintContainer: FunctionComponent<ContraintContainerProps> = ({ validation }) => {
  const options: any = [
    { label: 'value1', value: '1' },
    { label: 'value2', value: '2' },
    { label: 'value3', value: '3' },
    { label: 'value4', value: '4' },
    { label: 'value5', value: '5' }
  ]
  return (
    <React.Fragment>
      <Container className="bg-light border">
        <Row style={{ backgroundColor: '#A9C8D9' }}>
          <Label className="p-3 m-0 ps-4">
          Constraints
          </Label>
        </Row>
      </Container>
      <Container className="bg-light border">
        <Row>
          <Label className="p-2 m-0 ps-4 text-muted">
            PRIMARY KEY
          </Label>
        </Row>
      </Container>
      <Container className="bg-white border">
        <Row>
          <Table borderless>
            <thead>
              <tr style={{ backgroundColor: '#F3F6F9' }}>
                <th className='text-muted' style={{ width: '250px' }}>Genaration Type</th>
                <th className='text-muted'>Primary Key Fields</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td style={{ width: 'fit-content' }}>
                  <Select
                    id="exampleSelect"
                    name="contraint-pkey-gen-type"
                    options={options}
                    value={validation.values?.contraint?.primaryKey?.generationType}
                    onChange={(generationType) => {
                      validation.setFieldValue('contraints', {
                        ...validation.values.contraints,
                        primaryKey: {...validation.values.contraints.primaryKey, generationType}
                      })
                    }}
                  />
                </td>
              </tr>
            </tbody>
          </Table>
        </Row>
      </Container>
      <Container className="bg-light border">
        <Row>
          <Label className="p-2 m-0 ps-4 text-muted ">
            COMPOUND UNIQUE
          </Label>
        </Row>
      </Container>
    </React.Fragment>
  )
}
