## 0.27.0

### Highlights

#### Improved video player
Added playback rate controls, fit width/height, theater mode, improved scrubbing experience, better touch support, tap to seek.  
> The scrubbing hover zone is bigger  
> ![Peek 2021-04-05 16-47](https://user-images.githubusercontent.com/17180727/113587189-b8525e80-962e-11eb-915b-6ad6eadc16e0.gif)


#### Initial data support in plugins
Plugins can now access the initial state of items for richer queries or data manipulation.  
For plugin developers, this means that you can now access more data such as a scene's studio, its actors, its movies...
For example, a scene matcher plugin can use the scene's studio in its queries, or a renamer plugin can use these values to insert them into the filename.  
From the user's standpoint, nothing changes but your plugins can only get better !

### Migration guide
No breaking changes from 0.26

### Bug fixes
- **ui:** video previews were offset by 2% in video player ([#1254](https://github.com/porn-vault/porn-vault/pull/1254))
- **ui:** only show custom fields applicable to actors on Actors List page ([b1b091c](https://github.com/porn-vault/porn-vault/commit/b1b091c6e9c8e89dca64530bce6e0f9447efc7a5))
- **processing** processing would fail when using a self-signed https cert ([#1368](https://github.com/porn-vault/porn-vault/pull/1368))
- **scene:** prevent changing a scene's path to another scene's path ([8f361c](https://github.com/porn-vault/porn-vault/commit/8f361c405bdd669c38822cec3f60de65521c9d94))
- **scene:** deleting the first screenshot would delete the thumbnail ([#1318](https://github.com/porn-vault/porn-vault/pull/1318))
- **scene:** moving a scene in the `sceneCreated` event would cause thumbnail/preview generation to fail ([753968](https://github.com/porn-vault/porn-vault/commit/75396899447c537c876c514c290b687a4eae4c43))
- **movie:** could not delete a movie ([#1341](https://github.com/porn-vault/porn-vault/pull/1341))
- **label:** only match the created label ([#1317](https://github.com/porn-vault/porn-vault/pull/1317))
- **logs:** log files could exceed the max ([#1319](https://github.com/porn-vault/porn-vault/pull/1319))

### Enhancements
- **ui:** various video player enhancements ([#1254](https://github.com/porn-vault/porn-vault/pull/1254))
- - add playback rate controls
- - add theater mode
- - add fit width/height button
- - show scrubbing time under preview
- - add play/pause & scrubbing touch support
- - tap to seek backwards/forwards on the left/right 25% of the video
- - facilitate scrubbing by increasing the hover zone height
- **plugins:** add `util` as `ctx.$util`
- **logs:** log graphql errors ([#1360](https://github.com/porn-vault/porn-vault/pull/1360))