import React, { useState, useEffect } from 'react'

import { v4 as uuidv4 } from 'uuid'
import classd from 'classd'
import { Button, Modal } from 'react-bootstrap'
import Select from 'react-select'

import {
  formComponents,
  validateDefinition,
  definitionIsInvalid,
  FormComponent,
  GenericForm,
  formValidators,
  fieldsLayouts,
  interceptors,
  singletonComponents,
  submitButtonWidgets,
} from './core'

import {
  BaseLayout,
  gatherFileUids,
  result_worth_processing,
  mainComponents,
  wrapperComponents
} from './pages'

import {
  orderBy,
  modifyHelper,
  pathToUpdate,
  getByPath,
  setByPath,
  update
} from './utils'

Object.assign(formValidators, {
  maxLength: (s, { value }) =>
    (s + '').length >= value &&
    `Length shouldn\'t exceed ${value} characters (now: ${(s + '').length})`,
  minNumber: (s, { value }, definition) => {
    const f = parseFloat(s)
    if (f < value) return `Minimum value — ${value}`
  },
  maxNumber: (s, { value }, definition) => {
    const f = parseFloat(s)
    if (f > value) return `Maximum value — ${value}`
  }
})

singletonComponents.RequiredWrapper = ({ required, children }) =>
  required ? (
    <span style={{ fontWeight: 'bold' }}>
      {children} <span className='text-red'>*</span>
    </span>
  ) : (
    <span style={{ fontWeight: 'bold' }}>{children || null}</span>
  )

singletonComponents.FieldLabel = ({ definition, id, context, children }) => {
  return (
    <div className='my-1'>
      <singletonComponents.RequiredWrapper required={definition.required}>
        {definition.label}
      </singletonComponents.RequiredWrapper>
      {children}
    </div>
  )
}

const BooleanField = ({
  value,
  onChange,
  error,
  definition,
  context,
  path,
  disabled
}) => {
  const id = 'id_' + uuidv4()
  // const { label } = definition
  return (
    <div className='form-check text-dark'>
      <input
        className='form-check-input'
        type='checkbox'
        checked={!!value}
        onChange={(e) => {
          onChange(e.target.checked)
        }}
        id={id}
        disabled={!!disabled}
      />
      <label className='form-check-label' htmlFor={id}>
        {definition.label}
      </label>
      {error && <div className='invalid-feedback d-block'>{error}</div>}
    </div>
  )
}
BooleanField.isEmpty = (x) => !x
Object.assign(formComponents, {
  BooleanField
})

const TextField = ({
  value,
  onChange,
  error,
  definition,
  context,
  onReset,
  path,
  disabled
}) => {
  const id = 'id_' + uuidv4()
  // const { label } = definition
  return (
    <singletonComponents.FieldLabel
      definition={definition}
      id={id}
      context={context}
    >
      <input
        id={id}
        type={definition.subtype || 'text'}
        className={classd`form-control ${{ 'is-invalid': error }}`}
        value={value || ''}
        onChange={(e) => {
          onChange(e.target.value)
          onReset(path)
        }}
        placeholder={definition.placeholder || ''}
        style={context.style}
        disabled={!!disabled}
      />
      {error && <div className='invalid-feedback d-block'>{error}</div>}
    </singletonComponents.FieldLabel>
  )
}
TextField.isEmpty = (x) => !x
Object.assign(formComponents, {
  TextField
})

const TextareaField = ({
  value,
  onChange,
  error,
  definition,
  context,
  path
}) => {
  const id = 'id_' + uuidv4()
  // const { label } = definition
  return (
    <singletonComponents.FieldLabel
      definition={definition}
      id={id}
      context={context}
    >
      <textarea
        id={id}
        type='text'
        className={classd`form-control ${{ 'is-invalid': error }}`}
        value={value || ''}
        onChange={(e) => {
          if (definition.readonly) return
          onChange(e.target.value)
        }}
      />
      {error && <div className='invalid-feedback d-block'>{error}</div>}
    </singletonComponents.FieldLabel>
  )
}
TextareaField.isEmpty = (x) => !x
Object.assign(formComponents, {
  TextareaField
})

const NumberField = ({ value, onChange, error, definition, context, path }) => {
  const id = 'id_' + uuidv4()
  // const { label } = definition
  const labelStyle = {}
  if (context.labelColor) {
    labelStyle.style = { color: context.labelColor }
  }
  const extra = {}
  for (const k of ['min', 'max']) {
    const v = (
      definition?.validators?.find(
        (validator) => validator.type === `${k}Number`
      ) || {}
    ).value
    if (typeof v === 'number') {
      extra[k] = v
    }
  }
  // const values = [7, 5, 11];
  return (
    <singletonComponents.FieldLabel
      definition={definition}
      id={id}
      context={context}
    >
      <div
        style={{ display: 'flex', alignItems: 'center' }}
        className='currency-input-wrapper'
      >
        <input
          {...extra}
          id={id}
          type='number'
          className={classd`form-control ${{ 'is-invalid': error }}`}
          value={value + '' || ''}
          onChange={(e) => {
            onChange(e.target.value)
          }}
        />
        {definition.is_percent && (
          <div style={{ marginLeft: '0.25rem', fontSize: '0.825rem' }}>%</div>
        )}
        {definition.suffix && (
          <div style={{ marginLeft: '0.25rem', fontSize: '0.825rem' }}>
            {definition.suffix}
          </div>
        )}
      </div>
      {error && <div className='invalid-feedback d-block'>{error}</div>}
    </singletonComponents.FieldLabel>
  )
}
NumberField.isEmpty = (x) => !x
Object.assign(formComponents, {
  NumberField
})

export let selectCustomStyles = {}

export let selectCustomComponents = {}

const removeOptions = (options, notAllowedOptions) => {
  return options
    ?.filter(({ value }) => {
      return !value || !notAllowedOptions.has(value)
    })
    .map(({ value, options, ...props }) => {
      if (options) {
        return { ...props, options: removeOptions(options, notAllowedOptions) }
      } else {
        return { value, ...props }
      }
    })
}

const SelectField = ({
  value,
  onChange,
  error,
  definition,
  onReset,
  path,
  context,
  disabled
}) => {
  const id = 'id_' + uuidv4()
  // const { label } = definition
  const labelStyle = {}
  const inputStyle = {}
  if (context.labelColor) {
    labelStyle.style = { color: context.labelColor }
  }
  let options = definition.options
  if (context?.exhaustOptions?.[definition.k]) {
    // console.log('kkk', context);
    const notAllowedOptions = new Set(context?.exhaustOptions?.[definition.k])
    if (value) notAllowedOptions.delete(value?.value)
    options = removeOptions(options, notAllowedOptions)
  }
  const applySortValue = (x) => {
    if (definition.sort_value_by)
      return orderBy(x, (i) => i[definition.sort_value_by])
    return x
  }
  const additionalProps = {
    styles: {
      control: (provided, state) => {
        const result = { ...provided }
        if (error) result.borderColor = 'red'
        return result
      },
      menu: (provided, state) => {
        const result = { ...provided }
        result.zIndex = 2 // intlTelInput glitch
        return result
      }
    }
  }
  if (context.select_custom_styles) {
    additionalProps.styles = {
      ...additionalProps.styles,
      ...selectCustomStyles[context.select_custom_styles]
    }
    additionalProps.components =
      selectCustomComponents[context.select_custom_styles]
  }

  /* const ctx = useContext(GenericFormContext);

  // create_form
  const onSubmit = async (value) => {
    // ok
    //onChange(state, setErrors);
    const result = await ctx.onChange({...value, id: definition?.id});
    ctx.addOptionById(definition?.id, result.value);
    onChange(result.value);
  }; */
  const Wrapper =
    /* definition?.create_form ? ({ children }) => <div style={{display: "flex", alignItems: "center"}}>
    <div style={{flex: 1}}>
      {children[0]}
    </div>
    <div style={{flex: 0, marginLeft: "0.25rem"}}>
      {children[1]}
    </div>
  </div> : */ React.Fragment
  return (
    <Wrapper>
      <singletonComponents.FieldLabel
        definition={definition}
        id={id}
        context={context}
      >
        <div
          style={{
            margin: '0.6em 0',
            ...(context.selectWidth ? { width: context.selectWidth } : {})
          }}
        >
          <Select
            id={id}
            isClearable={
              !definition.multiple &&
              !definition.required &&
              !definition.nonCleanable
            }
            isMulti={!!definition.multiple}
            type='text'
            className={classd`${{ 'is-invalid': error }}`}
            value={value || null}
            onChange={(x) => {
              onChange(applySortValue(x))
              onReset(path)
            }}
            placeholder={definition.placeholder}
            options={options}
            style={inputStyle}
            isOptionDisabled={(option) => option.disabled}
            isDisabled={!!disabled}
            {...additionalProps}
          />
        </div>
        {error && <div className='invalid-feedback d-block'>{error}</div>}
      </singletonComponents.FieldLabel>
      {/* definition.create_form && <>
        <FormComponent
          definition={{...definition.create_form.fields, layout: "ModalLayout", inside: ({ setShow }) => (
            <button type="button" className="el-button el-button--text" onClick={setShow}>
              <i className="fas fa-plus-square fa-2x" />
            </button>
          ), title: `Create ${definition.create_form.verbose_name}`}}
          value={definition.create_form?.data || {}}
          onChange={onSubmit}
          context={{}}
          path={[]}
        />
      </> */}
    </Wrapper>
  )
}
SelectField.isEmpty = (x) => !x?.value
Object.assign(formComponents, {
  SelectField
})

const ModalLayout = (props) => {
  const { value, onChange, definition, error, context, onReset, path } = props
  /* this is Fields, but renderedFields are thrown away */
  const [show, setShow] = useState(false)
  const [state, setState] = useState(value)
  const [errors, setErrors] = useState(null)
  useEffect(() => {
    // console.log('reset to', value);
    setState(value)
    setErrors(null)
  }, [show])
  const onReset1 = (path) => {
    setErrors(update(errors, pathToUpdate(path, { $set: null })), null)
  }
  const handleClose = (_) => setShow(false)
  const handleSubmit = (state) => {
    const error = validateDefinition(definition, state, state, context) // TODO parent state?
    setErrors(error)
    if (!definitionIsInvalid(definition, error, state, state, context)) {
      // ok
      onChange(state)
      onReset(path)
      handleClose()
    } else {
      /* NotificationManager.error(
        "Please fix the errors below",
        "Error"
      );
      setTimeout(() => {
        try {
          document
            .getElementsByClassName("invalid-feedback d-block")[0]
            .parentNode.scrollIntoViewIfNeeded();
        } catch (e) {
          console.warn(e);
        }
      }, 50); */
    }
  }
  const { AddButton, hidePrimaryButton } = definition
  return (
    <div>
      {AddButton ? (
        <AddButton
          onClick={(_) => {
            setShow(true)
          }}
        />
      ) : (
        <button
          className='btn btn-primary'
          type='button'
          onClick={(e) => {
            setShow(true)
          }}
        >
          <i className='fa fa-plus' /> Add
        </button>
      )}
      <Modal
        show={show}
        onHide={handleClose}
        animation={false}
        container={(_) => document.getElementById('bootstrap-modals')}
        size={context?.modalSize || 'lg'}
      >
        <Modal.Header closeButton>
          <Modal.Title>{definition.title || 'Edit'}</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div>
            <FormComponent
              definition={{ ...definition, layout: void 0 }}
              value={state}
              onChange={setState}
              error={errors}
              onReset={onReset1}
              path={[]}
              context={{
                ...context,
                forceLabelWidth: '100%',
                labelPlacement: 'horizontalPlus',
                handleSubmit
              }}
            />
          </div>
        </Modal.Body>
        <Modal.Footer>
          <Button variant='secondary' onClick={handleClose}>
            Close
          </Button>
          {!hidePrimaryButton && (
            <Button variant='primary' onClick={(_) => handleSubmit(state)}>
              OK
            </Button>
          )}
        </Modal.Footer>
      </Modal>
      {error?.__own && (
        <div className='invalid-feedback d-block'>{error.__own + ''}</div>
      )}
    </div>
  )
}
Object.assign(fieldsLayouts, {
  ModalLayout
})

const WithDeleteButton = ({ definition, renderedFields }) => {
  return (
    <div className='card mb-1'>
      <div className='card-body d-flex align-items-start'>
        <div className='flex-grow-1'>{renderedFields}</div>
        <a
          href='#'
          className='btn btn-sm btn-outline-danger'
          style={{ marginLeft: 16 }}
          onClick={(e) => {
            e.preventDefault()
            definition.onChangeParent(
              definition.parent.filter((x, i) => i != definition.index)
            )
          }}
        >
          ×
        </a>
      </div>
    </div>
  )
}

Object.assign(fieldsLayouts, {
  WithDeleteButton
})

export {
  validateDefinition,
  definitionIsInvalid,
  pathToUpdate,
  FormComponent,
  formComponents,
  GenericForm,
  interceptors,
  getByPath,
  setByPath,
  modifyHelper,
  fieldsLayouts,
  update,
  singletonComponents,
  BaseLayout,
  gatherFileUids,
  result_worth_processing,
  mainComponents,
  wrapperComponents,
  submitButtonWidgets,
}
