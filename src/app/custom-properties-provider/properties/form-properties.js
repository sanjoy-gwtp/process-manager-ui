import { TextFieldEntry, SelectEntry, isTextFieldEntryEdited, isSelectEntryEdited } from '@bpmn-io/properties-panel';
import { useService } from 'bpmn-js-properties-panel';
import { getBusinessObject } from 'bpmn-js/lib/util/ModelUtil';

export default function(element) {

  return [
    {
      id: 'formKey',
      element,
      component: FormKey,
      isEdited: isTextFieldEntryEdited
    },
    {
      id: 'formRef',
      element,
      component: FormRef,
      isEdited: isTextFieldEntryEdited
    },
    {
      id: 'formType',
      element,
      component: FormType,
      isEdited: isSelectEntryEdited
    }
  ];
}

function FormKey(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');
  const moddle = useService('moddle');

  const getValue = () => {
    const businessObject = getBusinessObject(element);
    return businessObject.get('flowable:formKey') || businessObject.formKey || '';
  }

  const setValue = value => {
    const businessObject = getBusinessObject(element);
    
    // Remove old formKey if it exists
    if (businessObject.formKey) {
      modeling.updateProperties(element, {
        formKey: undefined
      });
    }
    
    // Set the flowable:formKey
    return modeling.updateProperties(element, {
      'flowable:formKey': value
    });
  }

  return new TextFieldEntry({
    id,
    element,
    getValue,
    setValue,
    debounce,
    label: translate('Form Key'),
    description: translate('Reference to the form to be displayed for this user task')
  });
}

function FormRef(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');
  const debounce = useService('debounceInput');

  const getValue = () => {
    const businessObject = getBusinessObject(element);
    return businessObject.get('flowable:formRef') || businessObject.formRef || '';
  }

  const setValue = value => {
    const businessObject = getBusinessObject(element);
    
    // Remove old formRef if it exists
    if (businessObject.formRef) {
      modeling.updateProperties(element, {
        formRef: undefined
      });
    }
    
    return modeling.updateProperties(element, {
      'flowable:formRef': value
    });
  }

  return new TextFieldEntry({
    id,
    element,
    getValue,
    setValue,
    debounce,
    label: translate('Form Reference'),
    description: translate('Reference to an external form definition')
  });
}

function FormType(props) {
  const { element, id } = props;

  const modeling = useService('modeling');
  const translate = useService('translate');

  const getValue = () => {
    const businessObject = getBusinessObject(element);
    return businessObject.get('flowable:formType') || businessObject.formType || 'embedded';
  }

  const setValue = value => {
    const businessObject = getBusinessObject(element);
    
    // Remove old formType if it exists
    if (businessObject.formType) {
      modeling.updateProperties(element, {
        formType: undefined
      });
    }
    
    return modeling.updateProperties(element, {
      'flowable:formType': value
    });
  }

  const getOptions = () => {
    return [
      { value: 'embedded', label: translate('Embedded Form') },
      { value: 'external', label: translate('External Form') },
      { value: 'generated', label: translate('Generated Form') },
      { value: 'custom', label: translate('Custom Form Component') }
    ];
  }

  return new SelectEntry({
    id,
    element,
    getValue,
    setValue,
    getOptions,
    label: translate('Form Type'),
    description: translate('Type of form to be used for this user task')
  });
}