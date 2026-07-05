import type { ReactElement } from 'react'
import {
  Button,
  Dialog,
  DialogTrigger,
  Heading,
  Modal,
  ModalOverlay,
} from 'react-aria-components'
import { useFormStore } from '../store/useFormStore'
import {
  dangerButtonClass,
  dialogClass,
  overlayClass,
  secondaryButtonClass,
} from './styles'

export function ResetButton(): ReactElement {
  const reset = useFormStore((state) => state.reset)

  return (
    <DialogTrigger>
      <Button className={secondaryButtonClass}>Reset</Button>
      <ModalOverlay isDismissable className={overlayClass}>
        <Modal className={dialogClass}>
          <Dialog role="alertdialog" className="outline-hidden">
            {({ close }) => (
              <>
                <Heading
                  slot="title"
                  className="text-lg font-semibold text-ink"
                >
                  Clear all answers?
                </Heading>
                <p className="mt-2 text-ink-muted">
                  Every answer in this form will be removed. This cannot be
                  undone.
                </p>
                <div className="mt-4 flex justify-end gap-2">
                  <Button className={secondaryButtonClass} onPress={close}>
                    Cancel
                  </Button>
                  <Button
                    className={dangerButtonClass}
                    onPress={() => {
                      reset()
                      close()
                    }}
                  >
                    Clear answers
                  </Button>
                </div>
              </>
            )}
          </Dialog>
        </Modal>
      </ModalOverlay>
    </DialogTrigger>
  )
}
