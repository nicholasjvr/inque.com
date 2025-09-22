var X={};console.log("[DEBUG] AI Configuration module loaded");const Q=typeof window<"u",B=Q?window.GOOGLE_AI_API_KEY||localStorage.getItem("GOOGLE_AI_API_KEY"):typeof process<"u"?X.GOOGLE_AI_API_KEY:null;console.log("[DEBUG] Environment check - GOOGLE_AI_API_KEY present:",!!B);const R={GOOGLE_AI_API_KEY:B,MODEL:"gemini-pro"};var N;(function(e){e.STRING="string",e.NUMBER="number",e.INTEGER="integer",e.BOOLEAN="boolean",e.ARRAY="array",e.OBJECT="object"})(N||(N={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */var T;(function(e){e.LANGUAGE_UNSPECIFIED="language_unspecified",e.PYTHON="python"})(T||(T={}));var b;(function(e){e.OUTCOME_UNSPECIFIED="outcome_unspecified",e.OUTCOME_OK="outcome_ok",e.OUTCOME_FAILED="outcome_failed",e.OUTCOME_DEADLINE_EXCEEDED="outcome_deadline_exceeded"})(b||(b={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const M=["user","model","function","system"];var L;(function(e){e.HARM_CATEGORY_UNSPECIFIED="HARM_CATEGORY_UNSPECIFIED",e.HARM_CATEGORY_HATE_SPEECH="HARM_CATEGORY_HATE_SPEECH",e.HARM_CATEGORY_SEXUALLY_EXPLICIT="HARM_CATEGORY_SEXUALLY_EXPLICIT",e.HARM_CATEGORY_HARASSMENT="HARM_CATEGORY_HARASSMENT",e.HARM_CATEGORY_DANGEROUS_CONTENT="HARM_CATEGORY_DANGEROUS_CONTENT",e.HARM_CATEGORY_CIVIC_INTEGRITY="HARM_CATEGORY_CIVIC_INTEGRITY"})(L||(L={}));var x;(function(e){e.HARM_BLOCK_THRESHOLD_UNSPECIFIED="HARM_BLOCK_THRESHOLD_UNSPECIFIED",e.BLOCK_LOW_AND_ABOVE="BLOCK_LOW_AND_ABOVE",e.BLOCK_MEDIUM_AND_ABOVE="BLOCK_MEDIUM_AND_ABOVE",e.BLOCK_ONLY_HIGH="BLOCK_ONLY_HIGH",e.BLOCK_NONE="BLOCK_NONE"})(x||(x={}));var F;(function(e){e.HARM_PROBABILITY_UNSPECIFIED="HARM_PROBABILITY_UNSPECIFIED",e.NEGLIGIBLE="NEGLIGIBLE",e.LOW="LOW",e.MEDIUM="MEDIUM",e.HIGH="HIGH"})(F||(F={}));var G;(function(e){e.BLOCKED_REASON_UNSPECIFIED="BLOCKED_REASON_UNSPECIFIED",e.SAFETY="SAFETY",e.OTHER="OTHER"})(G||(G={}));var _;(function(e){e.FINISH_REASON_UNSPECIFIED="FINISH_REASON_UNSPECIFIED",e.STOP="STOP",e.MAX_TOKENS="MAX_TOKENS",e.SAFETY="SAFETY",e.RECITATION="RECITATION",e.LANGUAGE="LANGUAGE",e.BLOCKLIST="BLOCKLIST",e.PROHIBITED_CONTENT="PROHIBITED_CONTENT",e.SPII="SPII",e.MALFORMED_FUNCTION_CALL="MALFORMED_FUNCTION_CALL",e.OTHER="OTHER"})(_||(_={}));var D;(function(e){e.TASK_TYPE_UNSPECIFIED="TASK_TYPE_UNSPECIFIED",e.RETRIEVAL_QUERY="RETRIEVAL_QUERY",e.RETRIEVAL_DOCUMENT="RETRIEVAL_DOCUMENT",e.SEMANTIC_SIMILARITY="SEMANTIC_SIMILARITY",e.CLASSIFICATION="CLASSIFICATION",e.CLUSTERING="CLUSTERING"})(D||(D={}));var $;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.AUTO="AUTO",e.ANY="ANY",e.NONE="NONE"})($||($={}));var U;(function(e){e.MODE_UNSPECIFIED="MODE_UNSPECIFIED",e.MODE_DYNAMIC="MODE_DYNAMIC"})(U||(U={}));/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class g extends Error{constructor(n){super(`[GoogleGenerativeAI Error]: ${n}`)}}class y extends g{constructor(n,t){super(n),this.response=t}}class q extends g{constructor(n,t,s,i){super(n),this.status=t,this.statusText=s,this.errorDetails=i}}class C extends g{}class W extends g{}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const ee="https://generativelanguage.googleapis.com",te="v1beta",ne="0.24.1",se="genai-js";var E;(function(e){e.GENERATE_CONTENT="generateContent",e.STREAM_GENERATE_CONTENT="streamGenerateContent",e.COUNT_TOKENS="countTokens",e.EMBED_CONTENT="embedContent",e.BATCH_EMBED_CONTENTS="batchEmbedContents"})(E||(E={}));class ie{constructor(n,t,s,i,o){this.model=n,this.task=t,this.apiKey=s,this.stream=i,this.requestOptions=o}toString(){var n,t;const s=((n=this.requestOptions)===null||n===void 0?void 0:n.apiVersion)||te;let o=`${((t=this.requestOptions)===null||t===void 0?void 0:t.baseUrl)||ee}/${s}/${this.model}:${this.task}`;return this.stream&&(o+="?alt=sse"),o}}function oe(e){const n=[];return e?.apiClient&&n.push(e.apiClient),n.push(`${se}/${ne}`),n.join(" ")}async function re(e){var n;const t=new Headers;t.append("Content-Type","application/json"),t.append("x-goog-api-client",oe(e.requestOptions)),t.append("x-goog-api-key",e.apiKey);let s=(n=e.requestOptions)===null||n===void 0?void 0:n.customHeaders;if(s){if(!(s instanceof Headers))try{s=new Headers(s)}catch(i){throw new C(`unable to convert customHeaders value ${JSON.stringify(s)} to Headers: ${i.message}`)}for(const[i,o]of s.entries()){if(i==="x-goog-api-key")throw new C(`Cannot set reserved header name ${i}`);if(i==="x-goog-api-client")throw new C(`Header name ${i} can only be set using the apiClient field`);t.append(i,o)}}return t}async function ae(e,n,t,s,i,o){const r=new ie(e,n,t,s,o);return{url:r.toString(),fetchOptions:Object.assign(Object.assign({},ue(o)),{method:"POST",headers:await re(r),body:i})}}async function A(e,n,t,s,i,o={},r=fetch){const{url:a,fetchOptions:c}=await ae(e,n,t,s,i,o);return ce(a,c,r)}async function ce(e,n,t=fetch){let s;try{s=await t(e,n)}catch(i){le(i,e)}return s.ok||await de(s,e),s}function le(e,n){let t=e;throw t.name==="AbortError"?(t=new W(`Request aborted when fetching ${n.toString()}: ${e.message}`),t.stack=e.stack):e instanceof q||e instanceof C||(t=new g(`Error fetching from ${n.toString()}: ${e.message}`),t.stack=e.stack),t}async function de(e,n){let t="",s;try{const i=await e.json();t=i.error.message,i.error.details&&(t+=` ${JSON.stringify(i.error.details)}`,s=i.error.details)}catch{}throw new q(`Error fetching from ${n.toString()}: [${e.status} ${e.statusText}] ${t}`,e.status,e.statusText,s)}function ue(e){const n={};if(e?.signal!==void 0||e?.timeout>=0){const t=new AbortController;e?.timeout>=0&&setTimeout(()=>t.abort(),e.timeout),e?.signal&&e.signal.addEventListener("abort",()=>{t.abort()}),n.signal=t.signal}return n}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function w(e){return e.text=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning text from the first candidate only. Access response.candidates directly to use the other candidates.`),O(e.candidates[0]))throw new y(`${m(e)}`,e);return fe(e)}else if(e.promptFeedback)throw new y(`Text not available. ${m(e)}`,e);return""},e.functionCall=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),O(e.candidates[0]))throw new y(`${m(e)}`,e);return console.warn("response.functionCall() is deprecated. Use response.functionCalls() instead."),H(e)[0]}else if(e.promptFeedback)throw new y(`Function call not available. ${m(e)}`,e)},e.functionCalls=()=>{if(e.candidates&&e.candidates.length>0){if(e.candidates.length>1&&console.warn(`This response had ${e.candidates.length} candidates. Returning function calls from the first candidate only. Access response.candidates directly to use the other candidates.`),O(e.candidates[0]))throw new y(`${m(e)}`,e);return H(e)}else if(e.promptFeedback)throw new y(`Function call not available. ${m(e)}`,e)},e}function fe(e){var n,t,s,i;const o=[];if(!((t=(n=e.candidates)===null||n===void 0?void 0:n[0].content)===null||t===void 0)&&t.parts)for(const r of(i=(s=e.candidates)===null||s===void 0?void 0:s[0].content)===null||i===void 0?void 0:i.parts)r.text&&o.push(r.text),r.executableCode&&o.push("\n```"+r.executableCode.language+`
`+r.executableCode.code+"\n```\n"),r.codeExecutionResult&&o.push("\n```\n"+r.codeExecutionResult.output+"\n```\n");return o.length>0?o.join(""):""}function H(e){var n,t,s,i;const o=[];if(!((t=(n=e.candidates)===null||n===void 0?void 0:n[0].content)===null||t===void 0)&&t.parts)for(const r of(i=(s=e.candidates)===null||s===void 0?void 0:s[0].content)===null||i===void 0?void 0:i.parts)r.functionCall&&o.push(r.functionCall);if(o.length>0)return o}const he=[_.RECITATION,_.SAFETY,_.LANGUAGE];function O(e){return!!e.finishReason&&he.includes(e.finishReason)}function m(e){var n,t,s;let i="";if((!e.candidates||e.candidates.length===0)&&e.promptFeedback)i+="Response was blocked",!((n=e.promptFeedback)===null||n===void 0)&&n.blockReason&&(i+=` due to ${e.promptFeedback.blockReason}`),!((t=e.promptFeedback)===null||t===void 0)&&t.blockReasonMessage&&(i+=`: ${e.promptFeedback.blockReasonMessage}`);else if(!((s=e.candidates)===null||s===void 0)&&s[0]){const o=e.candidates[0];O(o)&&(i+=`Candidate was blocked due to ${o.finishReason}`,o.finishMessage&&(i+=`: ${o.finishMessage}`))}return i}function I(e){return this instanceof I?(this.v=e,this):new I(e)}function ge(e,n,t){if(!Symbol.asyncIterator)throw new TypeError("Symbol.asyncIterator is not defined.");var s=t.apply(e,n||[]),i,o=[];return i={},r("next"),r("throw"),r("return"),i[Symbol.asyncIterator]=function(){return this},i;function r(d){s[d]&&(i[d]=function(u){return new Promise(function(h,S){o.push([d,u,h,S])>1||a(d,u)})})}function a(d,u){try{c(s[d](u))}catch(h){f(o[0][3],h)}}function c(d){d.value instanceof I?Promise.resolve(d.value.v).then(l,p):f(o[0][2],d)}function l(d){a("next",d)}function p(d){a("throw",d)}function f(d,u){d(u),o.shift(),o.length&&a(o[0][0],o[0][1])}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const Y=/^data\: (.*)(?:\n\n|\r\r|\r\n\r\n)/;function pe(e){const n=e.body.pipeThrough(new TextDecoderStream("utf8",{fatal:!0})),t=Ee(n),[s,i]=t.tee();return{stream:Ce(s),response:me(i)}}async function me(e){const n=[],t=e.getReader();for(;;){const{done:s,value:i}=await t.read();if(s)return w(Se(n));n.push(i)}}function Ce(e){return ge(this,arguments,function*(){const t=e.getReader();for(;;){const{value:s,done:i}=yield I(t.read());if(i)break;yield yield I(w(s))}})}function Ee(e){const n=e.getReader();return new ReadableStream({start(s){let i="";return o();function o(){return n.read().then(({value:r,done:a})=>{if(a){if(i.trim()){s.error(new g("Failed to parse stream"));return}s.close();return}i+=r;let c=i.match(Y),l;for(;c;){try{l=JSON.parse(c[1])}catch{s.error(new g(`Error parsing JSON response: "${c[1]}"`));return}s.enqueue(l),i=i.substring(c[0].length),c=i.match(Y)}return o()}).catch(r=>{let a=r;throw a.stack=r.stack,a.name==="AbortError"?a=new W("Request aborted when reading from the stream"):a=new g("Error reading from the stream"),a})}}})}function Se(e){const n=e[e.length-1],t={promptFeedback:n?.promptFeedback};for(const s of e){if(s.candidates){let i=0;for(const o of s.candidates)if(t.candidates||(t.candidates=[]),t.candidates[i]||(t.candidates[i]={index:i}),t.candidates[i].citationMetadata=o.citationMetadata,t.candidates[i].groundingMetadata=o.groundingMetadata,t.candidates[i].finishReason=o.finishReason,t.candidates[i].finishMessage=o.finishMessage,t.candidates[i].safetyRatings=o.safetyRatings,o.content&&o.content.parts){t.candidates[i].content||(t.candidates[i].content={role:o.content.role||"user",parts:[]});const r={};for(const a of o.content.parts)a.text&&(r.text=a.text),a.functionCall&&(r.functionCall=a.functionCall),a.executableCode&&(r.executableCode=a.executableCode),a.codeExecutionResult&&(r.codeExecutionResult=a.codeExecutionResult),Object.keys(r).length===0&&(r.text=""),t.candidates[i].content.parts.push(r)}i++}s.usageMetadata&&(t.usageMetadata=s.usageMetadata)}return t}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function V(e,n,t,s){const i=await A(n,E.STREAM_GENERATE_CONTENT,e,!0,JSON.stringify(t),s);return pe(i)}async function J(e,n,t,s){const o=await(await A(n,E.GENERATE_CONTENT,e,!1,JSON.stringify(t),s)).json();return{response:w(o)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */function Z(e){if(e!=null){if(typeof e=="string")return{role:"system",parts:[{text:e}]};if(e.text)return{role:"system",parts:[e]};if(e.parts)return e.role?e:{role:"system",parts:e.parts}}}function v(e){let n=[];if(typeof e=="string")n=[{text:e}];else for(const t of e)typeof t=="string"?n.push({text:t}):n.push(t);return ye(n)}function ye(e){const n={role:"user",parts:[]},t={role:"function",parts:[]};let s=!1,i=!1;for(const o of e)"functionResponse"in o?(t.parts.push(o),i=!0):(n.parts.push(o),s=!0);if(s&&i)throw new g("Within a single message, FunctionResponse cannot be mixed with other type of part in the request for sending chat message.");if(!s&&!i)throw new g("No content is provided for sending chat message.");return s?n:t}function _e(e,n){var t;let s={model:n?.model,generationConfig:n?.generationConfig,safetySettings:n?.safetySettings,tools:n?.tools,toolConfig:n?.toolConfig,systemInstruction:n?.systemInstruction,cachedContent:(t=n?.cachedContent)===null||t===void 0?void 0:t.name,contents:[]};const i=e.generateContentRequest!=null;if(e.contents){if(i)throw new C("CountTokensRequest must have one of contents or generateContentRequest, not both.");s.contents=e.contents}else if(i)s=Object.assign(Object.assign({},s),e.generateContentRequest);else{const o=v(e);s.contents=[o]}return{generateContentRequest:s}}function j(e){let n;return e.contents?n=e:n={contents:[v(e)]},e.systemInstruction&&(n.systemInstruction=Z(e.systemInstruction)),n}function Ie(e){return typeof e=="string"||Array.isArray(e)?{content:v(e)}:e}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const K=["text","inlineData","functionCall","functionResponse","executableCode","codeExecutionResult"],ve={user:["text","inlineData"],function:["functionResponse"],model:["text","functionCall","executableCode","codeExecutionResult"],system:["text"]};function Ae(e){let n=!1;for(const t of e){const{role:s,parts:i}=t;if(!n&&s!=="user")throw new g(`First content should be with role 'user', got ${s}`);if(!M.includes(s))throw new g(`Each item should include role field. Got ${s} but valid roles are: ${JSON.stringify(M)}`);if(!Array.isArray(i))throw new g("Content should have 'parts' property with an array of Parts");if(i.length===0)throw new g("Each Content should have at least one part");const o={text:0,inlineData:0,functionCall:0,functionResponse:0,fileData:0,executableCode:0,codeExecutionResult:0};for(const a of i)for(const c of K)c in a&&(o[c]+=1);const r=ve[s];for(const a of K)if(!r.includes(a)&&o[a]>0)throw new g(`Content with role '${s}' can't contain '${a}' part`);n=!0}}function z(e){var n;if(e.candidates===void 0||e.candidates.length===0)return!1;const t=(n=e.candidates[0])===null||n===void 0?void 0:n.content;if(t===void 0||t.parts===void 0||t.parts.length===0)return!1;for(const s of t.parts)if(s===void 0||Object.keys(s).length===0||s.text!==void 0&&s.text==="")return!1;return!0}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */const k="SILENT_ERROR";class Oe{constructor(n,t,s,i={}){this.model=t,this.params=s,this._requestOptions=i,this._history=[],this._sendPromise=Promise.resolve(),this._apiKey=n,s?.history&&(Ae(s.history),this._history=s.history)}async getHistory(){return await this._sendPromise,this._history}async sendMessage(n,t={}){var s,i,o,r,a,c;await this._sendPromise;const l=v(n),p={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(i=this.params)===null||i===void 0?void 0:i.generationConfig,tools:(o=this.params)===null||o===void 0?void 0:o.tools,toolConfig:(r=this.params)===null||r===void 0?void 0:r.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,cachedContent:(c=this.params)===null||c===void 0?void 0:c.cachedContent,contents:[...this._history,l]},f=Object.assign(Object.assign({},this._requestOptions),t);let d;return this._sendPromise=this._sendPromise.then(()=>J(this._apiKey,this.model,p,f)).then(u=>{var h;if(z(u.response)){this._history.push(l);const S=Object.assign({parts:[],role:"model"},(h=u.response.candidates)===null||h===void 0?void 0:h[0].content);this._history.push(S)}else{const S=m(u.response);S&&console.warn(`sendMessage() was unsuccessful. ${S}. Inspect response object for details.`)}d=u}).catch(u=>{throw this._sendPromise=Promise.resolve(),u}),await this._sendPromise,d}async sendMessageStream(n,t={}){var s,i,o,r,a,c;await this._sendPromise;const l=v(n),p={safetySettings:(s=this.params)===null||s===void 0?void 0:s.safetySettings,generationConfig:(i=this.params)===null||i===void 0?void 0:i.generationConfig,tools:(o=this.params)===null||o===void 0?void 0:o.tools,toolConfig:(r=this.params)===null||r===void 0?void 0:r.toolConfig,systemInstruction:(a=this.params)===null||a===void 0?void 0:a.systemInstruction,cachedContent:(c=this.params)===null||c===void 0?void 0:c.cachedContent,contents:[...this._history,l]},f=Object.assign(Object.assign({},this._requestOptions),t),d=V(this._apiKey,this.model,p,f);return this._sendPromise=this._sendPromise.then(()=>d).catch(u=>{throw new Error(k)}).then(u=>u.response).then(u=>{if(z(u)){this._history.push(l);const h=Object.assign({},u.candidates[0].content);h.role||(h.role="model"),this._history.push(h)}else{const h=m(u);h&&console.warn(`sendMessageStream() was unsuccessful. ${h}. Inspect response object for details.`)}}).catch(u=>{u.message!==k&&console.error(u)}),d}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function Re(e,n,t,s){return(await A(n,E.COUNT_TOKENS,e,!1,JSON.stringify(t),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */async function we(e,n,t,s){return(await A(n,E.EMBED_CONTENT,e,!1,JSON.stringify(t),s)).json()}async function Ne(e,n,t,s){const i=t.requests.map(r=>Object.assign(Object.assign({},r),{model:n}));return(await A(n,E.BATCH_EMBED_CONTENTS,e,!1,JSON.stringify({requests:i}),s)).json()}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class P{constructor(n,t,s={}){this.apiKey=n,this._requestOptions=s,t.model.includes("/")?this.model=t.model:this.model=`models/${t.model}`,this.generationConfig=t.generationConfig||{},this.safetySettings=t.safetySettings||[],this.tools=t.tools,this.toolConfig=t.toolConfig,this.systemInstruction=Z(t.systemInstruction),this.cachedContent=t.cachedContent}async generateContent(n,t={}){var s;const i=j(n),o=Object.assign(Object.assign({},this._requestOptions),t);return J(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(s=this.cachedContent)===null||s===void 0?void 0:s.name},i),o)}async generateContentStream(n,t={}){var s;const i=j(n),o=Object.assign(Object.assign({},this._requestOptions),t);return V(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(s=this.cachedContent)===null||s===void 0?void 0:s.name},i),o)}startChat(n){var t;return new Oe(this.apiKey,this.model,Object.assign({generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:(t=this.cachedContent)===null||t===void 0?void 0:t.name},n),this._requestOptions)}async countTokens(n,t={}){const s=_e(n,{model:this.model,generationConfig:this.generationConfig,safetySettings:this.safetySettings,tools:this.tools,toolConfig:this.toolConfig,systemInstruction:this.systemInstruction,cachedContent:this.cachedContent}),i=Object.assign(Object.assign({},this._requestOptions),t);return Re(this.apiKey,this.model,s,i)}async embedContent(n,t={}){const s=Ie(n),i=Object.assign(Object.assign({},this._requestOptions),t);return we(this.apiKey,this.model,s,i)}async batchEmbedContents(n,t={}){const s=Object.assign(Object.assign({},this._requestOptions),t);return Ne(this.apiKey,this.model,n,s)}}/**
 * @license
 * Copyright 2024 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *   http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */class Te{constructor(n){this.apiKey=n}getGenerativeModel(n,t){if(!n.model)throw new g("Must provide a model name. Example: genai.getGenerativeModel({ model: 'my-model-name' })");return new P(this.apiKey,n,t)}getGenerativeModelFromCachedContent(n,t,s){if(!n.name)throw new C("Cached content must contain a `name` field.");if(!n.model)throw new C("Cached content must contain a `model` field.");const i=["model","systemInstruction"];for(const r of i)if(t?.[r]&&n[r]&&t?.[r]!==n[r]){if(r==="model"){const a=t.model.startsWith("models/")?t.model.replace("models/",""):t.model,c=n.model.startsWith("models/")?n.model.replace("models/",""):n.model;if(a===c)continue}throw new C(`Different value for "${r}" specified in modelParams (${t[r]}) and cachedContent (${n[r]})`)}const o=Object.assign(Object.assign({},t),{model:n.model,tools:n.tools,toolConfig:n.toolConfig,systemInstruction:n.systemInstruction,cachedContent:n});return new P(this.apiKey,o,s)}}class be{constructor(){R.GOOGLE_AI_API_KEY?(this.genAI=new Te(R.GOOGLE_AI_API_KEY),this.model=this.genAI.getGenerativeModel({model:R.MODEL})):(console.warn("[CSS ANALYZER] No AI API key configured, using fallback mode"),this.genAI=null),this.cssIssues={missingDependencies:[],unusedStyles:[],invalidSelectors:[],performanceIssues:[],compatibilityIssues:[],accessibilityIssues:[]},console.log("[CSS ANALYZER] CSS analyzer initialized successfully")}log(n,t=null){console.log(`[CSS ANALYZER] ${n}`,t||"")}error(n,t=null){console.error(`[CSS ANALYZER ERROR] ${n}`,t||"")}async analyzeWidgetFiles(n,t=null){try{this.log("Starting CSS analysis for widget files",{fileCount:n.length,hasHTML:!!t});const s={cssFiles:[],dependencies:[],issues:[],recommendations:[],optimization:null},i=n.filter(r=>r.name.match(/\.css$/i)),o=n.filter(r=>!r.name.match(/\.css$/i));s.cssFiles=i.map(r=>({name:r.name,size:r.size,type:"css"}));for(const r of i){const a=await this.readFileContent(r),c=await this.analyzeCSSFile(r.name,a);s.issues.push(...c.issues)}if(t){const r=await this.readFileContent(t),a=this.analyzeHTMLDependencies(r,n);s.dependencies=a.dependencies,s.issues.push(...a.issues);const c=await this.analyzeCSSUsage(i,r);s.issues.push(...c.issues)}return s.recommendations=this.generateRecommendations(s.issues),s.optimization=await this.generateOptimizationSuggestions(i),this.log("CSS analysis completed",{cssFilesFound:i.length,totalIssues:s.issues.length,dependenciesFound:s.dependencies.length}),s}catch(s){return this.error("Error analyzing widget files",s),{cssFiles:[],dependencies:[],issues:[{type:"analysis_error",severity:"high",message:s.message}],recommendations:[],optimization:null}}}async analyzeCSSFile(n,t){const s=[];try{const i=this.performStaticAnalysis(t,n);if(s.push(...i),this.model){const o=await this.performAIAnalysis(t,n);o&&o.issues&&s.push(...o.issues)}return{issues:s}}catch(i){return this.error(`Error analyzing CSS file ${n}`,i),s.push({type:"analysis_error",severity:"medium",message:`Failed to analyze CSS file: ${i.message}`,file:n}),{issues:s}}}performStaticAnalysis(n,t){const s=[];n.split(`
`).forEach((a,c)=>{const l=a.trim();l&&!l.startsWith("/*")&&!l.startsWith("*")&&!l.endsWith(";")&&!l.endsWith("{")&&!l.endsWith("}")&&!l.endsWith(",")&&!l.startsWith("@")&&!l.includes("*/")&&s.push({type:"syntax",severity:"low",message:"Possible missing semicolon",line:c+1,file:t,suggestion:"Add semicolon at end of CSS declaration"})});const o=(n.match(/!important/g)||[]).length;return o>5&&s.push({type:"performance",severity:"medium",message:`High use of !important (${o} instances)`,file:t,suggestion:"Reduce !important usage and use more specific selectors"}),(n.match(/[^}]+{/g)||[]).forEach((a,c)=>{if(a.length>200){const l=n.substring(0,n.indexOf(a)).split(`
`).length;s.push({type:"performance",severity:"low",message:"Very long selector detected",line:l,file:t,suggestion:"Consider breaking down complex selectors for better maintainability"})}}),s}async performAIAnalysis(n,t){if(!this.model)return null;try{const s=`
        Analyze this CSS file for:
        1. Code quality issues
        2. Performance problems
        3. Best practices violations
        4. Browser compatibility issues
        5. Maintainability concerns

        CSS Content:
        ${n}

        Provide analysis in JSON format with this structure:
        {
          "issues": [
            {
              "type": "category",
              "severity": "low|medium|high",
              "message": "description",
              "line": line_number,
              "suggestion": "how to fix"
            }
          ]
        }
      `,r=(await this.model.generateContent(s)).response.text().match(/\{[\s\S]*\}/);return r?JSON.parse(r[0]):null}catch(s){return this.error("AI analysis failed",s),null}}analyzeHTMLDependencies(n,t){const s=[],i=[],o=/<link[^>]+href=["']([^"']+\.css[^"']*)["'][^>]*>/gi,r=/@import\s+["']([^"']+\.css[^"']*)["']/gi,a=/<style[^>]*>([\s\S]*?)<\/style>/gi;let c;for(;(c=o.exec(n))!==null;){const l=c[1],p=t.some(f=>f.name===l||f.name.endsWith("/"+l)||f.name.endsWith("\\"+l));i.push({type:"link",file:l,exists:p}),p||s.push({type:"missing_dependency",severity:"high",message:`CSS file referenced but not found: ${l}`,suggestion:"Ensure all referenced CSS files are included in the upload"})}for(;(c=r.exec(n))!==null;){const l=c[1],p=t.some(f=>f.name===l||f.name.endsWith("/"+l)||f.name.endsWith("\\"+l));i.push({type:"import",file:l,exists:p}),p||s.push({type:"missing_dependency",severity:"high",message:`Imported CSS file not found: ${l}`,suggestion:"Include imported CSS files in your upload"})}for(;(c=a.exec(n))!==null;){const l=c[1];l.trim()&&i.push({type:"inline",content:l.substring(0,100)+"...",exists:!0})}return{dependencies:i,issues:s}}async analyzeCSSUsage(n,t){const s=[];try{for(const i of n){const o=await this.readFileContent(i),r=this.extractSelectors(o);let a=[];for(const c of r)this.isSelectorUsed(c,t)||a.push(c);a.length>0&&s.push({type:"unused_css",severity:"low",message:`${a.length} unused CSS selectors in ${i.name}`,file:i.name,suggestion:"Consider removing unused CSS to reduce file size",details:a.slice(0,10).join(", ")+(a.length>10?"...":"")})}return{issues:s}}catch(i){return this.error("Error analyzing CSS usage",i),{issues:[]}}}extractSelectors(n){const t=[],s=/([^{]+)\s*{/g;let i;for(;(i=s.exec(n))!==null;){const o=i[1].trim();o&&!o.startsWith("@")&&!o.startsWith("/*")&&t.push(o)}return t}isSelectorUsed(n,t){const s=n.replace(/:hover|:focus|:active|:visited/g,"").replace(/::before|::after/g,"").replace(/\s+/g," ").trim();if(s.startsWith(".")){const i=s.substring(1);return new RegExp(`class=["'][^"']*\\b${i}\\b[^"']*["']`,"i").test(t)}if(s.startsWith("#")){const i=s.substring(1);return new RegExp(`id=["']${i}["']`,"i").test(t)}return/^[a-zA-Z][a-zA-Z0-9-]*/.test(s)?new RegExp(`<${s}`,"i").test(t):!1}generateRecommendations(n){const t=[],s=n.filter(o=>o.severity==="high"),i=n.filter(o=>o.severity==="medium");return s.length>0&&t.push({priority:"high",message:`Fix ${s.length} high-priority CSS issues`,details:s.map(o=>o.message).join("; ")}),i.length>0&&t.push({priority:"medium",message:`Review ${i.length} medium-priority CSS issues`,details:i.map(o=>o.message).join("; ")}),n.some(o=>o.type==="missing_dependency")&&t.push({priority:"high",message:"Ensure all CSS dependencies are included",details:"Missing CSS files can cause styling issues in your widget"}),n.some(o=>o.type==="unused_css")&&t.push({priority:"low",message:"Consider removing unused CSS",details:"Unused CSS increases file size and loading time"}),t}async generateOptimizationSuggestions(n){if(!this.model)return null;try{const s=`
        Analyze these CSS files for optimization opportunities:

        ${(await Promise.all(n.map(async a=>({name:a.name,content:await this.readFileContent(a)})))).map(a=>`File: ${a.name}
${a.content}`).join(`

`)}

        Provide optimization suggestions including:
        1. CSS minification opportunities
        2. Redundant rules removal
        3. Performance improvements
        4. Browser compatibility enhancements
        5. File size reduction strategies

        Format as JSON with structure:
        {
          "suggestions": [
            {
              "type": "optimization_type",
              "impact": "high|medium|low",
              "description": "what to do",
              "potentialSavings": "size reduction estimate"
            }
          ],
          "overallScore": "optimization score out of 100"
        }
      `,r=(await this.model.generateContent(s)).response.text().match(/\{[\s\S]*\}/);return r?JSON.parse(r[0]):null}catch(t){return this.error("Error generating optimization suggestions",t),null}}async readFileContent(n){return new Promise((t,s)=>{const i=new FileReader;i.onload=()=>t(i.result),i.onerror=()=>s(i.error),i.readAsText(n)})}async processCSSForUpload(n,t={}){const s={processedFiles:[],inlinedCSS:"",issues:[],recommendations:[]};try{const i=n.filter(d=>d.name.match(/\.html?$/i)),o=n.filter(d=>d.name.match(/\.css$/i));if(i.length===0)return this.log("No HTML files found for CSS processing"),s;const r=i[0],a=await this.readFileContent(r),c=this.extractInlineStyles(a);s.inlinedCSS=c;const l=await this.processExternalCSS(o),p=this.combineCSS(l,c),f=await this.optimizeCSS(p);if(s.processedFiles=n.filter(d=>!d.name.match(/\.css$/i)),t.inlineCSS){const d=this.inlineCSSIntoHTML(a,f,o);s.processedFiles.push({name:r.name,content:d,type:"html"})}else for(const d of o){const u=await this.readFileContent(d),h=await this.optimizeCSS(u);s.processedFiles.push({name:d.name,content:h,type:"css"})}return this.log("CSS processing completed",{originalFiles:n.length,processedFiles:s.processedFiles.length,cssOptimized:f.length<p.length}),s}catch(i){return this.error("Error processing CSS for upload",i),s.issues.push({type:"processing_error",severity:"high",message:i.message}),s}}extractInlineStyles(n){const t=/<style[^>]*>([\s\S]*?)<\/style>/gi;let s="",i;for(;(i=t.exec(n))!==null;)s+=i[1]+`
`;return s.trim()}async processExternalCSS(n){let t="";for(const s of n){const i=await this.readFileContent(s);t+=`/* ${s.name} */
${i}

`}return t.trim()}combineCSS(n,t){return n+(n&&t?`

`:"")+t}async optimizeCSS(n){let t=n;return t=t.replace(/\/\*[\s\S]*?\*\//g,""),t=t.replace(/\s+/g," "),t=t.replace(/; /g,";"),t=t.replace(/: /g,":"),t=t.replace(/{ /g,"{"),t=t.replace(/ }/g,"}"),t=t.replace(/[;\s]+}/g,"}"),t.trim()}inlineCSSIntoHTML(n,t,s){let i=n;for(const o of s)i=i.replace(new RegExp(`<link[^>]+href=["'][^"']*${o.name}[^"']*["'][^>]*>`,"gi"),"");if(i=i.replace(/@import\s+["'][^"']+\.css["'];?\s*/gi,""),t.trim()){const o=`<style>
${t}
</style>`;i=i.replace("</head>",`${o}
</head>`)}return i}}import.meta.url===`file://${process.argv[1]}`&&(console.log("[CSS ANALYZER] CSS Analyzer ready for use"),console.log("[CSS ANALYZER] Use this agent to analyze CSS files and optimize styling for widget uploads"));export{be as C};
