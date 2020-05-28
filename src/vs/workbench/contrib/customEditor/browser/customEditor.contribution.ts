/*---------------------------------------------------------------------------------------------
 *  Copyright (c) Microsoft Corporation. All rights reserved.
 *  Licensed under the MIT License. See License.txt in the project root for license information.
 *--------------------------------------------------------------------------------------------*/

import { SyncDescriptor } from 'vs/platform/instantiation/common/descriptors';
import { registerSingleton } from 'vs/platform/instantiation/common/extensions';
import { LifecyclePhase } from 'vs/platform/lifecycle/common/lifecycle';
import { Registry } from 'vs/platform/registry/common/platform';
import { EditorDescriptor, Extensions as EditorExtensions, IEditorRegistry } from 'vs/workbench/browser/editor';
import { Extensions as WorkbenchExtensions, IWorkbenchContributionsRegistry } from 'vs/workbench/common/contributions';
import { Extensions as EditorInputExtensions, IEditorInputFactoryRegistry } from 'vs/workbench/common/editor';
import { CustomEditorInputFactory } from 'vs/workbench/contrib/customEditor/browser/customEditorInputFactory';
import { ICustomEditorService } from 'vs/workbench/contrib/customEditor/common/customEditor';
import { WebviewEditor } from 'vs/workbench/contrib/webview/browser/webviewEditor';
import './commands';
import { CustomEditorInput } from './customEditorInput';
import { CustomEditorContribution, CustomEditorService } from './customEditors';
import { ServicesAccessor } from 'vs/editor/browser/editorExtensions';
import { IEditorService } from 'vs/workbench/services/editor/common/editorService';
import { CoreEditingCommands } from 'vs/editor/browser/controller/coreCommands';

registerSingleton(ICustomEditorService, CustomEditorService);

Registry.as<IWorkbenchContributionsRegistry>(WorkbenchExtensions.Workbench)
	.registerWorkbenchContribution(CustomEditorContribution, LifecyclePhase.Starting);

Registry.as<IEditorRegistry>(EditorExtensions.Editors)
	.registerEditor(
		EditorDescriptor.create(
			WebviewEditor,
			WebviewEditor.ID,
			'Webview Editor',
		), [
		new SyncDescriptor(CustomEditorInput)
	]);

Registry.as<IEditorInputFactoryRegistry>(EditorInputExtensions.EditorInputFactories)
	.registerEditorInputFactory(
		CustomEditorInputFactory.ID,
		CustomEditorInputFactory);

Registry.as<IEditorInputFactoryRegistry>(EditorInputExtensions.EditorInputFactories)
	.registerCustomEditorInputFactory(CustomEditorInputFactory);

function withActiveCustomEditor(accessor: ServicesAccessor, f: (editor: CustomEditorInput) => void): boolean {
	const editorService = accessor.get(IEditorService);
	const activeCustomEditor = editorService.activeEditor instanceof CustomEditorInput ? editorService.activeEditor : undefined;
	if (!activeCustomEditor) {
		return false;
	}
	f(activeCustomEditor);
	return true;
}

CoreEditingCommands.Undo.overrides.register(accessor => {
	return withActiveCustomEditor(accessor, webview => webview.undo());
});

CoreEditingCommands.Redo.overrides.register(accessor => {
	return withActiveCustomEditor(accessor, webview => webview.redo());
});
