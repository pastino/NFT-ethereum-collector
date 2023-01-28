type TextObjectType = "text";
export interface TextTypeKakaoTemplate {
  object_type: TextObjectType;
  text: string;
  link: { web_url: string; mobile_web_url: string };
  button_title?: string;
}

type FeedObjectType = "feed";
export interface FeedTypeKakaoTemplate {
  object_type: FeedObjectType;
  content: {
    title: string;
    description: string;
    image_url: string;
    image_width: string;
    image_height: string;
    link: {
      web_url: string;
      mobile_web_url: string;
      android_execution_params: string;
      ios_execution_params: string;
    };
  };
  item_content: {
    profile_text: string;
    profile_image_url: string;
    title_image_url: string;
    title_image_text: string;
    title_image_category: string;
    items: {
      item: string;
      item_op: string;
    }[];
  };
  social: {
    like_count: number;
    comment_count: number;
    shared_count: number;
    view_count: number;
    subscriber_count: number;
  };
  buttons: {
    title: string;
    link: {
      web_url: string;
      mobile_web_url: string;
      android_execution_params: string;
      ios_execution_params: string;
    };
  }[];
}
// 타입 참고 - https://developers.kakao.com/docs/latest/ko/message/rest-api#default-template-msg
