import React from 'react';
import { Disclosure, DisclosureButton, DisclosurePanel } from '@headlessui/react';
import { useTranslation } from '../../../language';

export const GameRule = ({ ruleDescription }: { ruleDescription: React.ReactNode }) => {
  const { t } = useTranslation();
  return <section className="flex justify-center mb-4 mt-1 max-w-[100ch]">
    <Disclosure defaultOpen>
      {({ open }) => (
        <div className="border-2 rounded-sm grow">
          <DisclosureButton
            className="w-full bg-slate-200 dark:bg-slate-700 text-lg sm:text-xl flex justify-center"
          >
            <span className="grow">{t({ hu: 'Játékszabályok', en: 'Game rules' })}</span>
            <span className="pr-4" aria-hidden="true">
              <span
                className="inline-block transition-transform"
                style={{ transform: open ? 'rotate(90deg)' : undefined }}
              >▸</span>
            </span>
          </DisclosureButton>
            <DisclosurePanel className="w-full p-2">
              <p className="text-justify">
                {ruleDescription}
              </p>
            </DisclosurePanel>
        </div>
      )}
    </Disclosure>
  </section>;
};
